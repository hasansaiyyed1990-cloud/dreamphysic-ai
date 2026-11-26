#!/usr/bin/env node
/**
 * DreamPhysic AI - static frontend audit (Node 20+, zero dependencies).
 *
 * Usage: node scripts/audit-frontend.mjs
 * Exit:  0 = no critical issue, 1 = exposed secret or XSS sink found.
 *
 * Scope: frontend/src/**, frontend/vite.config.*, frontend/capacitor.config.*
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND = path.join(ROOT, 'frontend');
const SRC = path.join(FRONTEND, 'src');

const USE_COLOR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const paint = (code, text) => (USE_COLOR ? `\u001b[${code}m${text}\u001b[0m` : text);
const STATUS_COLOR = { PASS: '32', WARN: '33', FAIL: '31' };

const TEXT_EXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.html', '.json', '.svg']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'android', 'ios', 'coverage']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
    } else if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function readText(file) {
  try {
    if (fs.statSync(file).size > 2_000_000) return null;
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function configFiles(prefix) {
  if (!fs.existsSync(FRONTEND)) return [];
  return fs
    .readdirSync(FRONTEND)
    .filter((name) => new RegExp(`^${prefix}\\.config\\.`).test(name))
    .map((name) => path.join(FRONTEND, name));
}

const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) if (text[i] === '\n') line += 1;
  return line;
}

const files = [...new Set([...walk(SRC), ...configFiles('vite'), ...configFiles('capacitor')])];
const docs = files
  .map((file) => ({ file, rel: rel(file), text: readText(file) }))
  .filter((doc) => doc.text !== null);

const srcDocs = docs.filter((doc) => doc.rel.startsWith('frontend/src/'));
const cssDocs = docs.filter((doc) => doc.file.endsWith('.css'));

const rows = [];
let criticalCount = 0;

function add(label, status, detail, critical = false) {
  rows.push({ label, status, detail });
  if (status === 'FAIL' && critical) criticalCount += 1;
}

const clip = (text, max = 96) => (text.length > max ? `${text.slice(0, max - 3)}...` : text);

/* ------------------------------------------------------------------ */
/* a) Exposed secrets                                                  */
/* ------------------------------------------------------------------ */

const SECRET_PATTERNS = [
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'API secret key', re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'PostgreSQL URL', re: /postgres(?:ql)?:\/\/[^\s'"`<>]+/gi },
  { name: 'Hardcoded bearer JWT', re: /Bearer\s+eyJ[A-Za-z0-9_-]{10,}/g },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Hardcoded JWT secret', re: /\bJWT_SECRET\b\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/g },
];

const secretFindings = [];
for (const doc of srcDocs) {
  for (const { name, re } of SECRET_PATTERNS) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(doc.text)) !== null) {
      secretFindings.push({
        name,
        file: doc.rel,
        line: lineAt(doc.text, match.index),
        preview: `${match[0].slice(0, 8)}...`,
      });
      if (match[0].length === 0) re.lastIndex += 1;
    }
  }
}
add(
  'Exposed secrets',
  secretFindings.length ? 'FAIL' : 'PASS',
  secretFindings.length
    ? `${secretFindings.length} hardcoded credential(s) - first at ${secretFindings[0].file}:${secretFindings[0].line}`
    : 'no API keys, JWT secrets or DB URLs in frontend source',
  true,
);

/* ------------------------------------------------------------------ */
/* b) XSS and unsafe DOM                                               */
/* ------------------------------------------------------------------ */

const XSS_PATTERNS = [
  { name: 'dangerouslySetInnerHTML', re: /dangerouslySetInnerHTML\s*=/g },
  { name: 'innerHTML assignment', re: /\.innerHTML\s*=/g },
  { name: 'eval()', re: /(^|[^\w.$])eval\s*\(/g },
];

const xssFindings = [];
for (const doc of srcDocs) {
  for (const { name, re } of XSS_PATTERNS) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(doc.text)) !== null) {
      xssFindings.push({ name, file: doc.rel, line: lineAt(doc.text, match.index) });
      if (match[0].length === 0) re.lastIndex += 1;
    }
  }
}
add(
  'Unsafe DOM / XSS',
  xssFindings.length ? 'FAIL' : 'PASS',
  xssFindings.length
    ? `${xssFindings.length} sink(s) - first ${xssFindings[0].name} at ${xssFindings[0].file}:${xssFindings[0].line}`
    : 'no dangerouslySetInnerHTML, innerHTML assignment or eval()',
  true,
);

/* ------------------------------------------------------------------ */
/* c) Auth storage, offline safety, cancellation, error boundary       */
/* ------------------------------------------------------------------ */

const clients = srcDocs.filter(
  (doc) => /fetch\s*\(/.test(doc.text) && /localStorage\.(?:get|set|remove)Item/.test(doc.text),
);

const forcedLogouts = [];
for (const doc of clients) {
  const re = /if\s*\(([^)]*(?:403|!==?\s*200|!\s*(?:res|response)\.ok)[^)]*)\)\s*\{([\s\S]{0,500}?)\}/g;
  let match;
  while ((match = re.exec(doc.text)) !== null) {
    if (/(?:removeItem|logout|clearToken|setToken\s*\(\s*['"`]{2})/.test(match[2])) {
      forcedLogouts.push({
        file: doc.rel,
        line: lineAt(doc.text, match.index),
        condition: match[1].trim().replace(/\s+/g, ' '),
      });
    }
  }
}

const handles401 = clients.some((doc) => /===\s*401/.test(doc.text));
if (forcedLogouts.length) {
  const first = forcedLogouts[0];
  add(
    'Auth logout only on 401',
    'FAIL',
    `forced logout on "${clip(first.condition, 42)}" at ${first.file}:${first.line}`,
  );
} else if (!clients.length) {
  add('Auth logout only on 401', 'WARN', 'no token-aware fetch client found in frontend/src');
} else if (!handles401) {
  add('Auth logout only on 401', 'WARN', 'client never handles 401 (expired token is not cleared)');
} else {
  add('Auth logout only on 401', 'PASS', 'token is cleared on 401 only; network/403 errors keep the session');
}

const hasAbort = srcDocs.some((doc) => /new AbortController\s*\(|AbortSignal\.timeout/.test(doc.text));
add(
  'AbortController timeouts',
  hasAbort ? 'PASS' : 'WARN',
  hasAbort ? 'request cancellation wired into the API layer' : 'no AbortController/AbortSignal timeout found - flaky mobile requests can hang',
);

const hasBoundary = srcDocs.some((doc) => /getDerivedStateFromError|componentDidCatch/.test(doc.text));
add(
  'ErrorBoundary coverage',
  hasBoundary ? 'PASS' : 'WARN',
  hasBoundary ? 'render errors are caught instead of white-screening the WebView' : 'no ErrorBoundary found',
);

/* ------------------------------------------------------------------ */
/* d) 60fps Android anti-lag                                           */
/* ------------------------------------------------------------------ */

function mapSegments(text) {
  const segments = [];
  let index = 0;
  while ((index = text.indexOf('.map(', index)) !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = index + 4; i < text.length; i += 1) {
      if (text[i] === '(') depth += 1;
      else if (text[i] === ')') {
        if (depth === 0) {
          end = i;
          break;
        }
        depth -= 1;
      }
    }
    segments.push([index, end === -1 ? Math.min(text.length, index + 2000) : end]);
    index += 5;
    if (segments.length > 500) break;
  }
  return segments;
}

const blurFindings = [];
const seenBlur = new Set();
for (const doc of srcDocs) {
  for (const [start, end] of mapSegments(doc.text)) {
    const segment = doc.text.slice(start, end);
    if (!/backdrop[-_ ]?blur|backdropFilter|backdrop-filter/i.test(segment)) continue;
    const key = `${doc.rel}:${lineAt(doc.text, start)}`;
    if (seenBlur.has(key)) continue;
    seenBlur.add(key);
    blurFindings.push({ file: doc.rel, line: lineAt(doc.text, start) });
  }
}
add(
  'backdrop-blur in list loops',
  blurFindings.length ? 'WARN' : 'PASS',
  blurFindings.length
    ? `${blurFindings.length} .map() item(s) paint blur - GPU cost on scroll (${blurFindings[0].file}:${blurFindings[0].line})`
    : 'no backdrop blur rendered per list item',
);

let hasGlobalInputMin = false;
const inputSizeIssues = [];
for (const doc of cssDocs) {
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let rule;
  while ((rule = ruleRe.exec(doc.text)) !== null) {
    const selector = rule[1].trim();
    const body = rule[2];
    const touchesInput = selector
      .split(',')
      .map((part) => part.trim())
      .some(
        (part) =>
          /\b(input|textarea|select)\b/.test(part) &&
          !/checkbox|radio|range|color|file|hidden/i.test(part),
      );
    if (!touchesInput) continue;
    const sizeRe = /font-size\s*:\s*([0-9.]+)\s*(px|rem|em)/gi;
    let size;
    while ((size = sizeRe.exec(body)) !== null) {
      const px = Number(size[1]) * (size[2].toLowerCase() === 'px' ? 1 : 16);
      if (px >= 16) hasGlobalInputMin = true;
      else {
        inputSizeIssues.push({
          file: doc.rel,
          line: lineAt(doc.text, rule.index),
          selector: selector.split(',')[0].trim(),
          px,
        });
      }
    }
  }
}
if (!hasGlobalInputMin) {
  add('Input font-size >= 16px', 'WARN', 'no input/select/textarea rule enforces 16px (iOS zoom on focus)');
} else if (inputSizeIssues.length) {
  const first = inputSizeIssues[0];
  add(
    'Input font-size >= 16px',
    'WARN',
    `${inputSizeIssues.length} input rule(s) drop below 16px - ${first.file}:${first.line} (${first.px}px)`,
  );
} else {
  add('Input font-size >= 16px', 'PASS', 'every input rule stays at 16px or larger');
}

const hasOverscroll = cssDocs.some((doc) => /overscroll-behavior-y\s*:\s*none/.test(doc.text));
add(
  'overscroll-behavior-y: none',
  hasOverscroll ? 'PASS' : 'WARN',
  hasOverscroll ? 'WebView bounce/rubber-band scroll is disabled' : 'missing overscroll-behavior-y: none',
);

const hasLazy = srcDocs.some((doc) => /React\.lazy\s*\(|\blazy\s*\(\s*\(\)\s*=>/.test(doc.text));
add(
  'React.lazy code splitting',
  hasLazy ? 'PASS' : 'WARN',
  hasLazy ? 'routes are lazily loaded' : 'no React.lazy splitting - first paint ships one bundle',
);

/* ------------------------------------------------------------------ */
/* e) Capacitor and Vite configuration                                 */
/* ------------------------------------------------------------------ */

const capacitorDocs = docs.filter((doc) => /capacitor\.config\./.test(doc.rel));
let capacitorOk = false;
let capacitorDetail = 'capacitor.config.* not found';
for (const doc of capacitorDocs) {
  let scheme = null;
  try {
    scheme = JSON.parse(doc.text)?.server?.androidScheme ?? null;
  } catch {
    const match = doc.text.match(/androidScheme\s*:\s*['"]([^'"]+)['"]/);
    scheme = match ? match[1] : null;
  }
  if (scheme === 'https') {
    capacitorOk = true;
    capacitorDetail = `${doc.rel}: androidScheme "https"`;
    break;
  }
  capacitorDetail = `${doc.rel}: androidScheme "${scheme ?? 'missing'}"`;
}
add('Capacitor androidScheme https', capacitorOk ? 'PASS' : 'FAIL', capacitorDetail);

const viteDocs = docs.filter((doc) => /vite\.config\./.test(doc.rel));
const viteText = viteDocs.map((doc) => doc.text).join('\n');
const hasEs2020 = /['"]es2020['"]/.test(viteText);
const hasChrome87 = /['"]chrome87['"]/.test(viteText);
add(
  'Vite target es2020/chrome87',
  hasEs2020 && hasChrome87 ? 'PASS' : 'FAIL',
  !viteDocs.length
    ? 'vite.config.* not found'
    : `${hasEs2020 ? 'es2020' : 'es2020 missing'}, ${hasChrome87 ? 'chrome87' : 'chrome87 missing'}`,
);

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

function printTable() {
  const labelWidth = Math.max('CHECK'.length, ...rows.map((row) => row.label.length));
  const statusWidth = 'STATUS'.length;
  const line = (label, status, detail) =>
    `${label.padEnd(labelWidth)}  ${paint(STATUS_COLOR[status] ?? '0', status.padEnd(statusWidth))}  ${detail}`;

  console.log('');
  console.log(`${'CHECK'.padEnd(labelWidth)}  ${'STATUS'.padEnd(statusWidth)}  DETAIL`);
  console.log('-'.repeat(labelWidth + statusWidth + 3 + 60));
  for (const row of rows) {
    console.log(line(row.label, row.status, clip(row.detail, 110)));
  }
}

console.log('DreamPhysic AI - frontend audit');
console.log(`Scanned ${docs.length} file(s) under frontend/src/ + config files${fs.existsSync(SRC) ? '' : ' (frontend/src missing)'}`);

if (secretFindings.length) {
  console.log(paint('31', '\nCRITICAL - exposed secrets'));
  for (const finding of secretFindings.slice(0, 10)) {
    console.log(`  ${finding.file}:${finding.line}  ${finding.name}  ${finding.preview}`);
  }
  if (secretFindings.length > 10) console.log(`  ...and ${secretFindings.length - 10} more`);
}

if (xssFindings.length) {
  console.log(paint('31', '\nCRITICAL - XSS sinks'));
  for (const finding of xssFindings.slice(0, 10)) {
    console.log(`  ${finding.file}:${finding.line}  ${finding.name}`);
  }
  if (xssFindings.length > 10) console.log(`  ...and ${xssFindings.length - 10} more`);
}

printTable();

const counts = rows.reduce((acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }), {});
console.log(
  `\n${counts.PASS ?? 0} PASS | ${counts.WARN ?? 0} WARN | ${counts.FAIL ?? 0} FAIL | ` +
    `${criticalCount} critical (secrets/XSS)`,
);
console.log(
  criticalCount
    ? paint('31', 'Result: BLOCKED - remove the leaked credential or XSS sink before shipping.')
    : paint('32', 'Result: SAFE - no critical secret or XSS leak found.'),
);

process.exitCode = criticalCount > 0 ? 1 : 0;
