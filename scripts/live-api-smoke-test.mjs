#!/usr/bin/env node
/**
 * DreamPhysic AI - live API smoke test (Node 20+, zero dependencies).
 *
 * Read-only: only GET/OPTIONS requests and one deliberately malformed login
 * payload are sent, so no database rows are ever created.
 *
 * Usage: node scripts/live-api-smoke-test.mjs [--url https://host] [--timeout 12000]
 * Exit:  0 = all checks passed, 1 = one or more checks failed.
 */

const DEFAULT_URL = 'https://dreamphysic-ai-production.up.railway.app';

const USE_COLOR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const paint = (code, text) => (USE_COLOR ? `\u001b[${code}m${text}\u001b[0m` : text);
const STATUS_COLOR = { PASS: '32', FAIL: '31' };

const argv = process.argv.slice(2);
function flagValue(name) {
  const withEquals = argv.find((arg) => arg.startsWith(`${name}=`));
  if (withEquals) return withEquals.slice(name.length + 1);
  const index = argv.indexOf(name);
  return index !== -1 ? argv[index + 1] : undefined;
}

const base = (flagValue('--url') ?? flagValue('-u') ?? DEFAULT_URL).replace(/\/+$/, '');
if (!/^https?:\/\//i.test(base)) {
  console.error(`Invalid --url: ${base}`);
  process.exit(1);
}
const TIMEOUT_MS = Number(flagValue('--timeout') ?? 12000);

const rows = [];

async function request(method, pathname, { headers = {}, body } = {}) {
  const started = performance.now();
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body,
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await response.text();
  const latency = Math.round(performance.now() - started);
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, headers: response.headers, text, json, latency };
}

function record(check, { ok, status, latency, detail }) {
  rows.push({
    check,
    status: ok ? 'PASS' : 'FAIL',
    http: status === undefined ? '-' : String(status),
    latency: latency === undefined ? '-' : `${latency} ms`,
    detail,
  });
}

const LEAK_PATTERNS = [
  /\bjava\.(?:lang|util|sql|io|net)\./i,
  /\borg\.(?:springframework|hibernate)\b/i,
  /\bjavax?\.persistence\b/i,
  /\bSQLException\b/i,
  /\bHibernate\b/i,
  /\bat\s+[a-z0-9_$.]+\.[A-Z][A-Za-z0-9_$]*\(/,
  /"trace"\s*:/i,
];

/* ------------------------------------------------------------------ */
/* Checks - each returns { ok, status, latency, detail }               */
/* ------------------------------------------------------------------ */

async function health() {
  const res = await request('GET', '/api/health');
  const rawStatus = res.json?.data?.status ?? res.json?.status ?? '';
  const up = String(rawStatus).toUpperCase() === 'UP' || (res.json === null && /\bUP\b/i.test(res.text));
  return {
    ok: res.status === 200 && up,
    status: res.status,
    latency: res.latency,
    detail: up ? 'status UP' : `expected 200 + UP, got ${res.status} ${String(rawStatus || res.text).slice(0, 40)}`,
  };
}

async function appVersion() {
  const res = await request('GET', '/api/app-version');
  const validJson = res.json !== null && typeof res.json === 'object';
  const version = res.json?.data?.version ?? res.json?.version ?? 'ok';
  return {
    ok: res.status === 200 && validJson,
    status: res.status,
    latency: res.latency,
    detail: validJson ? `valid JSON (${String(version).slice(0, 40)})` : 'invalid JSON body',
  };
}

function protectedCheck(pathname) {
  return async () => {
    const res = await request('GET', pathname);
    return {
      ok: res.status === 401,
      status: res.status,
      latency: res.latency,
      detail: res.status === 401 ? '401 as expected' : `expected 401, got ${res.status}`,
    };
  };
}

function actuatorCheck(pathname) {
  return async () => {
    const res = await request('GET', pathname);
    const blocked = [401, 403, 404].includes(res.status);
    return {
      ok: blocked,
      status: res.status,
      latency: res.latency,
      detail: blocked ? `blocked (${res.status})` : `EXPOSED (${res.status}) - lockdown failed`,
    };
  };
}

async function cors() {
  const origin = 'https://localhost';
  const res = await request('OPTIONS', '/api/health', {
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });
  const allowed = res.headers.get('access-control-allow-origin');
  const ok = allowed === origin || allowed === '*';
  return {
    ok,
    status: res.status,
    latency: res.latency,
    detail: ok ? `allow-origin ${allowed}` : `missing/wrong allow-origin (${allowed ?? 'none'})`,
  };
}

async function errorLeak() {
  const res = await request('POST', '/api/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    body: '{bad',
  });
  const leaks = LEAK_PATTERNS.filter((pattern) => pattern.test(res.text));
  return {
    ok: res.status === 400 && leaks.length === 0,
    status: res.status,
    latency: res.latency,
    detail:
      res.status !== 400
        ? `expected 400, got ${res.status}`
        : leaks.length
          ? `400 but leaked: ${leaks[0].source}`
          : '400 with no stack trace / SQL / Hibernate keywords',
  };
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

console.log('DreamPhysic AI - live API smoke test');
console.log(`Target: ${base}`);
console.log('Mode: read-only (GET/OPTIONS + one malformed login payload, no writes)\n');

const checks = [
  ['Health endpoint', health],
  ['App version endpoint', appVersion],
  ['Unauth GET /api/workouts', protectedCheck('/api/workouts')],
  ['Unauth GET /api/cardio/history', protectedCheck('/api/cardio/history')],
  ['Unauth GET /api/nutrition/diary', protectedCheck('/api/nutrition/diary')],
  ['Unauth GET /api/autopilot/today', protectedCheck('/api/autopilot/today')],
  ['Actuator /actuator/env', actuatorCheck('/actuator/env')],
  ['Actuator /actuator/beans', actuatorCheck('/actuator/beans')],
  ['Actuator /actuator/mappings', actuatorCheck('/actuator/mappings')],
  ['CORS preflight (Capacitor)', cors],
  ['Malformed JSON error leak', errorLeak],
];

for (const [label, run] of checks) {
  try {
    record(label, await run());
  } catch (error) {
    const cause = error?.cause?.code ?? error?.cause?.message ?? error?.message ?? String(error);
    record(label, {
      ok: false,
      detail: `${error?.name === 'TimeoutError' ? `timeout after ${TIMEOUT_MS} ms` : cause} (network unreachable?)`,
    });
  }
}

const checkWidth = Math.max('CHECK'.length, ...rows.map((row) => row.check.length));
const httpWidth = Math.max('HTTP'.length, ...rows.map((row) => row.http.length));
const latencyWidth = Math.max('LATENCY'.length, ...rows.map((row) => row.latency.length));

const line = (check, status, http, latency, detail) =>
  `${check.padEnd(checkWidth)}  ${paint(STATUS_COLOR[status], status)}  ` +
  `${http.padEnd(httpWidth)}  ${latency.padEnd(latencyWidth)}  ${detail}`;

console.log(
  `${'CHECK'.padEnd(checkWidth)}  ${'STATUS'.padEnd('STATUS'.length)}  ` +
    `${'HTTP'.padEnd(httpWidth)}  ${'LATENCY'.padEnd(latencyWidth)}  DETAIL`,
);
console.log('-'.repeat(checkWidth + httpWidth + latencyWidth + 26));
for (const row of rows) {
  console.log(line(row.check, row.status, row.http, row.latency, row.detail));
}

const failed = rows.filter((row) => row.status === 'FAIL');
console.log(`\n${rows.length - failed.length}/${rows.length} checks passed.`);
if (failed.length) {
  console.log(paint('31', `Failed: ${failed.map((row) => row.check).join(', ')}`));
}

process.exitCode = failed.length ? 1 : 0;
