package com.fitforge.ai;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic "coach brain" for goal questions (stamina/running, fat loss, strength).
 *
 * The language model is good at wording, but it invents timelines ("4 weeks me 10K sub-60")
 * unless the arithmetic is handed to it. This class computes target pace, weekly volume,
 * realistic week ranges, safe deficit and progression from the athlete's own logs, and
 * injects them as numbers the model must use instead of guessing.
 *
 * Package-private on purpose: only GeminiService should compose this into prompts.
 */
final class CoachBrain {

    private static final Pattern KM = Pattern.compile("(?<![\\d.,])(\\d{1,3}(?:[.,]\\d)?)\\s*(?:kms?|kilomet(?:er|re)s?|k\\b)");
    private static final Pattern MINUTES = Pattern.compile("(\\d{1,3})\\s*(?:mins?|minutes?|मिनट)");
    private static final Pattern HOURS = Pattern.compile("(\\d{1,2}(?:[.,]\\d)?)\\s*(?:hours?|hrs?|h\\b|ghant\\w*|घंट\\w*)");
    private static final Pattern CLOCK_PACE = Pattern.compile("(\\d{1,2}):(\\d{2})\\s*(?:/\\s*km|per\\s*km|min\\s*/\\s*km)");
    private static final Pattern WORD_PACE = Pattern.compile("(\\d{1,2})\\s*(?:mins?|minutes?)\\s*(?:/\\s*km|per\\s*km)");
    private static final Pattern SUB_TIME = Pattern.compile("sub[\\s-]?(\\d{1,3})\\b");
    private static final Pattern KG = Pattern.compile("(?<![\\d.,])(\\d{2,3}(?:[.,]\\d)?)\\s*(?:kgs?|kilos?)");
    private static final Pattern LOSE = Pattern.compile("(?:lose|losing|loss|kam|ghat|reduce|drop|minus|कम)\\D{0,14}(\\d{1,2}(?:[.,]\\d)?)\\s*(?:kgs?|kilos?)");
    private static final Pattern LOSE_REVERSED = Pattern.compile("(\\d{1,2}(?:[.,]\\d)?)\\s*(?:kgs?|kilos?)\\s*(?:kam|lose|ghat|reduce|drop|कम)");
    private static final Pattern FROM_TO = Pattern.compile("(\\d{2,3}(?:[.,]\\d)?)\\s*(?:se|to|->|→)\\s*(\\d{2,3}(?:[.,]\\d)?)\\s*(?:kgs?|kilos?)");
    private static final Pattern PR_WORD = Pattern.compile("\\bpr\\b|\\bprs\\b|personal record");
    private static final Pattern LEAN_WORD = Pattern.compile("\\blean(?:er|ing)?\\b");
    private static final Pattern MONTHS = Pattern.compile("(\\d{1,2})\\s*(?:months?|mahin\\w*|महीन\\w*)");
    private static final Pattern WEEKS = Pattern.compile("(\\d{1,2})\\s*(?:weeks?|hafte\\w*|हफ्त\\w*)");

    private CoachBrain() {}

    /** Returns a prompt block, or "" when the question is not a goal/timeline question. */
    static String build(String prompt, AiLiveContextService.LiveContext live) {
        if (prompt == null || prompt.isBlank() || live == null) return "";
        String p = prompt.toLowerCase(Locale.ROOT);
        List<String> blocks = new ArrayList<>();
        String reality = realityCheckBlock(p, live);
        if (!reality.isBlank()) blocks.add(reality);
        String endurance = enduranceBlock(p, live);
        if (!endurance.isBlank()) blocks.add(endurance);
        String fatLoss = fatLossBlock(p, live);
        if (!fatLoss.isBlank()) blocks.add(fatLoss);
        String strength = strengthBlock(p);
        if (!strength.isBlank()) blocks.add(strength);
        String nutrition = nutritionBlock(p, live);
        if (!nutrition.isBlank()) blocks.add(nutrition);
        if (blocks.isEmpty()) return "";
        // Returned raw on purpose: callers wrap it as [REQUIRED COACH MATH] next to the live profile.
        return String.join("\n", blocks);
    }

    // ---------------------------------------------------------------- endurance

    private static String enduranceBlock(String p, AiLiveContextService.LiveContext live) {
        boolean asks = p.contains("run") || p.contains("jog") || p.contains("bhag") || p.contains("daud")
                || p.contains("दौड़") || p.contains("दौड") || p.contains("stamina") || p.contains("endurance")
                || p.contains("marathon") || p.contains("treadmill") || p.contains("10k") || p.contains("5k")
                || p.contains("half marathon") || p.contains("cycling") || p.contains("cycle");
        double distance = maxDistanceKm(p);
        if (!asks && distance <= 0) return "";

        double timeMinutes = minutesFromPrompt(p);
        double promptPace = paceFromPrompt(p);
        if (promptPace > 0 && distance > 0 && timeMinutes <= 0) timeMinutes = promptPace * distance;

        boolean paceGoal = distance > 0 && timeMinutes > 0;
        boolean finishGoal = distance > 0 && timeMinutes <= 0;

        boolean hasBaseline = live.recentRunPaceMinPerKm() > 0;
        double baseline = hasBaseline ? live.recentRunPaceMinPerKm() : 8.0;
        String baselineText = hasBaseline
                ? "best logged run pace " + clock(baseline) + " min/km"
                : "no run with distance+time is logged, so this plan assumes an 8:00 min/km walk-jog start (one logged run replaces this assumption)";

        if (paceGoal) return paceGoalBlock(distance, timeMinutes, baseline, baselineText, hasBaseline, live);
        if (finishGoal) return finishDistanceBlock(distance, baseline, baselineText, live);
        return baseStaminaBlock(baseline, baselineText, distance);
    }

    private static String paceGoalBlock(double distance, double timeMinutes, double baseline, String baselineText,
                                        boolean hasBaseline, AiLiveContextService.LiveContext live) {
        double targetPace = timeMinutes / distance;
        double gainPct = (baseline - targetPace) / baseline * 100.0;
        StringBuilder out = new StringBuilder();
        out.append("**Endurance math: ").append(one(distance)).append(" km in ").append(clock(timeMinutes))
                .append(" = ").append(clock(targetPace)).append(" min/km target pace.** Baseline: ").append(baselineText).append(".\n");

        int lo;
        int hi;
        if (gainPct <= 1.0) {
            lo = 2;
            hi = 3;
            out.append("Requirement: your logged pace already covers this target, so this is 2-3 weeks of pace practice, not a fitness rebuild.\n");
        } else {
            // ~1.25% pace improvement per week is a realistic beginner rate; range covers bad weeks and missed runs.
            int weeks = (int) Math.max(4, Math.min(34, Math.ceil(gainPct / 1.25)));
            lo = Math.max(3, (int) Math.round(weeks * 0.8));
            hi = Math.max(lo + 2, (int) Math.round(weeks * 1.3));
            out.append("Requirement: ").append(Math.round(gainPct)).append("% faster than baseline - that is a real aerobic adaptation, not a two-week trick.\n");
        }
        out.append("Realistic timeline: ").append(lo).append("-").append(hi).append(" weeks (").append(lo * 7).append("-")
                .append(hi * 7).append(" days) at 3 runs/week, 80% easy, 1 quality session; 2 runs/week adds roughly 4-6 weeks.\n");

        double peak = Math.max(16, distance * 2.0);
        if (live.longestRunKm() > peak) peak = live.longestRunKm() + distance * 0.5;
        double current = live.weeklyRunKm() > 0 ? live.weeklyRunKm() : Math.max(6.0, live.longestRunKm() * 1.5);
        String currentNote = live.weeklyRunKm() > 0 ? one(current) + " km/week logged" : "assumed " + one(current) + " km/week (no 7-day cardio logs)";
        int volumeWeeks = (int) Math.max(3, Math.min(hi, Math.ceil(Math.log(peak / Math.max(2.0, current)) / Math.log(1.10))));
        out.append("Weekly volume: ").append(currentNote).append(" -> ").append(one(peak)).append(" km/week peak, +10% max per week (")
                .append(volumeWeeks).append(" weeks of build). Never add distance and speed in the same week.\n");

        double easyPace = Math.min(9.0, targetPace + 1.5);
        String sharpenLong = one(distance >= 10 ? 8 : Math.min(6, distance + 1));
        String specific = distance >= 10
                ? "long 9-10 km + 2 x 2 km at " + clock(targetPace) + "/km"
                : "long " + one(Math.min(8, distance + 2)) + " km + 4 x 1 km at " + clock(targetPace) + "/km";
        out.append("Phases: W1-4 base (walk-jog 4 min jog / 1 min walk, 3 x 25-30 min) | W5-8 build (easy 35-40 min + 1 tempo 15-20 min at ")
                .append(clock(easyPace - 0.35)).append("-").append(clock(targetPace + 0.25))
                .append("/km) | W9-12 sharpen (long ").append(sharpenLong).append(" km + 6 x 400 m at ").append(clock(targetPace))
                .append("/km, 200 m walk) | W13-16 specific (").append(specific)
                .append(") | last 7 days taper (2 easy 20 min runs, no new distance).\n");
        out.append("Sample week: Mon easy 25 min at ").append(clock(easyPace)).append("/km, Tue rest, Wed 6 x (1 min jog + 1 min walk), Thu rest, Fri easy 25 min, Sat long 35 min easy, Sun rest.\n");
        if (distance >= 10) {
            out.append("Splits to rehearse: 5 km in ").append(clock(targetPace * 5)).append(", 7.5 km in ")
                    .append(clock(targetPace * 7.5)).append(", 10 km in ").append(clock(timeMinutes)).append(".\n");
        }
        if (!hasBaseline) out.append("Assumption to fix: without a logged run this plan is provisional - first session is a 2 km comfortable time trial.\n");
        return out.toString();
    }

    private static String finishDistanceBlock(double distance, double baseline, String baselineText, AiLiveContextService.LiveContext live) {
        double longest = live.longestRunKm() > 0 ? live.longestRunKm() : 2.0;
        String longestText = live.longestRunKm() > 0 ? one(longest) + " km longest logged run" : "assumed 2 km start (no distance logged)";
        int weeks = (int) Math.max(4, Math.min(24, Math.ceil((distance + 1.0 - longest) / 0.75)));
        return "**Endurance math: first " + one(distance) + " km, no time target given - distance comes first, pace later.** Baseline: " + longestText + ".\n"
                + "Realistic timeline: " + weeks + " weeks (" + (weeks * 7) + " days) at 3 runs/week building the long run by 0.5-1 km per week (max +10% weekly volume).\n"
                + "Weekly shape: 2 easy runs " + clock(baseline) + "-" + clock(baseline + 0.5) + "/km (tum baat kar sako itna aaram) + 1 long run; peak week " + one(Math.min(distance * 2.2, Math.max(18, distance + 8))) + " km total.\n"
                + "Rules: long run is 30-35% of weekly km at most; if a run feels hard two days in a row, repeat the previous week instead of adding; last 10 days before the attempt, cut volume 40% and keep pace easy.\n"
                + "After the first successful " + one(distance) + " km, set a time goal (a beginner 10K finish is 70-80 min) and the pace plan starts.";
    }

    private static String baseStaminaBlock(double baseline, String baselineText, double distance) {
        String goalText = distance > 0 ? one(distance) + " km" : "no target distance/time";
        return "**Stamina base block (" + goalText + " given; build the engine before chasing a number).** Baseline: " + baselineText + ".\n"
                + "Weeks 1-2: 3 x 25 min walk-jog - 2 min brisk walk / 1 min easy jog, effort where tum baat kar sako (talk test), not gasping.\n"
                + "Weeks 3-4: 3 x 30-35 min same ratio, add 5 min only when the previous week felt easy.\n"
                + "Week 5 test: 2 km comfortable time trial, then set a real target. Realistic first milestones: 5 km non-stop in 8-10 weeks, 10 km in 16-20 weeks, at 3 sessions/week.\n"
                + "Never add time and speed together; stop for chest pain, dizziness or joint pain.";
    }

    // ---------------------------------------------------------------- fat loss

    private static String fatLossBlock(String p, AiLiveContextService.LiveContext live) {
        List<Double> kgs = allKg(p);
        Matcher fromTo = FROM_TO.matcher(p);
        boolean hasRange = fromTo.find();
        boolean liftingWords = p.contains("bench") || p.contains("squat") || p.contains("deadlift")
                || p.contains("press") || p.contains("curl") || p.contains("row") || p.contains("ohp");
        boolean asks = p.contains("weight loss") || p.contains("fat loss") || p.contains("lose") || p.contains("losing")
                || p.contains("kam karna") || p.contains("ghat") || p.contains("patla") || p.contains("belly")
                || p.contains("pet ") || p.contains("cutting") || p.contains(" cut ") || LEAN_WORD.matcher(p).find()
                || p.contains("fat kam") || p.contains("motap") || p.contains("target weight")
                || ((hasRange || kgs.size() >= 2) && !liftingWords);
        if (!asks) return "";

        double lost;
        Matcher lose = LOSE.matcher(p);
        Matcher loseReversed = LOSE_REVERSED.matcher(p);
        if (lose.find()) {
            lost = number(lose.group(1));
        } else if (loseReversed.find()) {
            lost = number(loseReversed.group(1));
        } else if (hasRange) {
            lost = Math.abs(number(fromTo.group(1)) - number(fromTo.group(2)));
        } else {
            if (kgs.size() >= 2) {
                double max = kgs.stream().mapToDouble(Double::doubleValue).max().orElse(0);
                double min = kgs.stream().mapToDouble(Double::doubleValue).min().orElse(0);
                lost = Math.abs(max - min);
            } else if (live.targetWeightKg() != null && live.weightLogged()) {
                lost = Math.max(0.5, live.protocolWeightKg() - live.targetWeightKg());
            } else {
                lost = 5.0;
            }
        }
        if (lost <= 0 || lost > 60) lost = 5.0;

        boolean logged = live.weightLogged();
        double bodyWeight = logged ? live.protocolWeightKg() : 70.0;
        String weightText = logged ? one(bodyWeight) + " kg logged" : "weight not logged, so 70 kg is assumed";
        // 0.5-1.0% of body weight per week; slower is fine, faster needs medical supervision.
        int slow = (int) Math.ceil(lost / (0.010 * bodyWeight));
        int fast = (int) Math.ceil(lost / (0.005 * bodyWeight));
        int weeksLo = Math.max(2, Math.min(fast, slow));
        int weeksHi = Math.max(weeksLo + 1, fast);

        double deficitMid = lost * 7700.0 / (Math.max(1, (weeksLo + weeksHi) / 2.0) * 7.0);
        int deficit = (int) Math.max(200, Math.min(750, Math.round(deficitMid / 25.0) * 25));
        double proteinLo = bodyWeight * 1.6;
        double proteinHi = bodyWeight * 2.0;

        StringBuilder out = new StringBuilder();
        out.append("**Fat-loss math: ").append(one(lost)).append(" kg to lose.** At 0.5-1.0% body weight/week that is ")
                .append(weeksLo).append("-").append(weeksHi).append(" weeks (").append(weeksLo * 7).append("-")
                .append(weeksHi * 7).append(" days), never faster without medical supervision. Basis: ").append(weightText).append(".\n");
        out.append("Daily deficit about ").append(deficit).append(" kcal from TDEE, protein ").append(Math.round(proteinLo))
                .append("-").append(Math.round(proteinHi)).append(" g/day, 2-3 strength sessions, 7-8k steps. Floor: never below BMR or 1200 kcal.\n");
        out.append("Tracking rule: weigh daily but judge only the 7-day average. If the average has not moved in 14 days, change one thing (add 1,000 steps or cut 150 kcal), then re-check for 14 days.\n");
        out.append("Strength ke saath: 3 full-body days (Mon/Wed/Fri) rakho, protein 3-4 meals me split karo; bahut busy week me 2 sessions tak aa sakte ho, 0 nahi.\n");
        long neededDays = weeksLo * 7L;
        long deadlineDays = 0;
        if (live.targetDate() != null && !live.targetDate().isBlank()) {
            try {
                deadlineDays = ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(live.targetDate()));
            } catch (RuntimeException ignored) {
                // Unparseable saved date is not worth failing the whole answer over.
            }
        }
        if (deadlineDays <= 0) {
            Matcher months = MONTHS.matcher(p);
            if (months.find()) deadlineDays = (long) number(months.group(1)) * 30;
            else {
                Matcher weeks = WEEKS.matcher(p);
                if (weeks.find()) deadlineDays = (long) number(weeks.group(1)) * 7;
            }
        }
        if (deadlineDays > 0 && deadlineDays < neededDays) {
            out.append("Deadline check: user expects it in about ").append(deadlineDays).append(" days but the safe range needs about ")
                    .append(neededDays).append(" days. Say this honestly in one line and propose a revised date of about ")
                    .append(LocalDate.now().plusDays(neededDays)).append(" instead of promising the original date.\n");
        }
        out.append("Recomp note: with strength training and this protein intake, scale weight may stay flat for 2-3 weeks while waist drops - measure waist weekly, not daily.\n");
        return out.toString();
    }

    // ---------------------------------------------------------------- nutrition

    private static String nutritionBlock(String p, AiLiveContextService.LiveContext live) {
        boolean asks = p.contains("protein") || p.contains("whey") || p.contains("diet plan") || p.contains("meal plan")
                || p.contains("khana kya") || p.contains("kya khaun") || p.contains("kya khau")
                || p.contains("khana batao") || p.contains("diet batao");
        if (!asks) return "";

        boolean logged = live.weightLogged();
        double bodyWeight = logged ? live.protocolWeightKg() : 70.0;
        String goal = live.primaryGoal() == null ? "" : live.primaryGoal().toLowerCase(Locale.ROOT);
        boolean cutting = goal.contains("loss") || goal.contains("fat") || goal.contains("cutting");
        double lo = bodyWeight * (cutting ? 1.8 : 1.6);
        double hi = bodyWeight * 2.0;
        int perMealLo = (int) Math.ceil(lo / 4.0);
        int perMealHi = (int) Math.ceil(hi / 3.0);

        boolean vegOnly = isVegOnly(p);
        String sources = vegOnly
                ? "Veg-only sources (egg/chicken nahi): paneer 100 g = 18 g | soya chunks 50 g dry = 26 g | dahi 200 g = 7 g | milk 250 ml = 8 g | cooked dal 1 katori = 7 g | whey 1 scoop (30 g) = 24 g (whey veg hai) | moong/chana sprouts 100 g = 7-9 g.\n"
                : "Indian sources (approx protein): paneer 100 g = 18 g | soya chunks 50 g dry = 26 g | dahi 200 g = 7 g | cooked dal 1 katori = 7 g | egg 1 = 6 g | milk 250 ml = 8 g | chicken 100 g = 22 g | whey 1 scoop (30 g) = 24 g.\n";
        String sampleDay = vegOnly
                ? "Easy beginner veg day: breakfast 100 g paneer + 1 roti | lunch 1 katori dal + 100 g paneer + 2 roti + salad | snack 200 g dahi + 25 g soya chunks | dinner 50 g soya chunks ya 100 g paneer + sabzi + 1-2 roti + 250 ml milk.\n"
                + "Veg tip: soya chunks sabse sasta high-protein option hai; dal akeli par depend na karo, warna target poora nahi hoga.\n"
                : "Easy beginner day: breakfast 3 eggs ya 100 g paneer + 1 roti | lunch 1 katori dal + 100 g paneer/chicken + 2 roti | snack 200 g dahi + 25 g soya chunks ya 1 scoop whey | dinner same protein + sabzi + 1-2 roti.\n";

        return "**Protein math (beginner" + (vegOnly ? ", veg" : "") + "): " + Math.round(lo) + "-" + Math.round(hi) + " g/day** for "
                + (logged ? one(bodyWeight) + " kg logged" : "70 kg assumed (weight not logged)")
                + " = " + perMealLo + "-" + perMealHi + " g per meal across 3-4 meals; one big meal me sab nahi.\n"
                + (cutting ? "Cutting me protein high rakho taaki muscle jaaye na: floor " + Math.round(lo) + " g, aur calories kam karte waqt bhi protein na ghatao.\n" : "\n")
                + sources
                + sampleDay
                + "Rule: har meal me ek clear protein source; sirf roti-chawal se target nahi bharega. Water 2.5-3 L, aur protein ke saath fibre (sabzi/salad) rakho.";
    }

    /** "veg protein", "egg nahi khata", "pure veg" - but never "non veg". */
    private static boolean isVegOnly(String p) {
        if (p.contains("non veg") || p.contains("non-veg") || p.contains("nonveg")) return false;
        return p.contains("veg") || p.contains("vegetarian") || p.contains("shakahari")
                || p.contains("egg nahi") || p.contains("anda nahi") || p.contains("no egg")
                || p.contains("egg nai") || p.contains("chicken nahi") || p.contains("without egg")
                || p.contains("veg only") || p.contains("sirf veg");
    }

    // ---------------------------------------------------------------- strength

    private static String strengthBlock(String p) {
        boolean liftSpecific = p.contains("bench") || p.contains("squat") || p.contains("deadlift") || p.contains("ohp")
                || p.contains("overhead press") || PR_WORD.matcher(p).find() || p.contains("curl") || p.contains("row");
        boolean asks = liftSpecific || p.contains("strength") || p.contains("muscle") || p.contains("hypertrophy")
                || p.contains("gym") || p.contains("weight badha") || p.contains("weight increase")
                || p.contains("bodyweight") || p.contains("push up") || p.contains("pushup");
        if (!asks) return "";

        StringBuilder out = new StringBuilder();
        out.append("**Strength progression math:** double progression - pehle reps, phir weight. Compound: 3-5 sets of 5-8 reps, RIR 2 (2 reps bache hue); isolation: 3 sets of 8-12. Upper body +2.5 kg when you hit the top of the range with clean form in 2 sessions; lower body +5 kg. Realistic pace: about 5 kg on a main lift every 6-8 weeks, 10 kg in 3-4 months, with a deload week (same exercises, 50-60% of sets) every 5-6 hard weeks or after 2 stalled sessions. Sleep 7-8 h and 1.6-2.0 g/kg protein decide whether that timeline holds.");
        if (!liftSpecific) {
            // General "strength training kaise karu / gym kaise start karu" needs an actual week, not only progression rules.
            out.append("\nBeginner full-body week (3 days, 45-55 min, rest day between sessions so same muscle ko 48 h milte hain):\n")
                    .append("Day A (Mon): squat ya goblet squat 3 x 6-8 | bench ya push-up 3 x 6-10 | one-arm dumbbell row 3 x 8-12 | plank 3 x 20-30 sec.\n")
                    .append("Day B (Wed): Romanian deadlift 3 x 6-8 | overhead press 3 x 6-10 | lat pulldown ya assisted pull-up 3 x 8-12 | dead bug 3 x 8 per side.\n")
                    .append("Day C (Fri): leg press ya split squat 3 x 8-10 | incline dumbbell press 3 x 8-12 | seated cable row 3 x 8-12 | calf raise 3 x 12-15 | side plank 2 x 15-20 sec per side.\n")
                    .append("Rest between sets: 90-120 sec on the big lifts, 60-90 sec on the rest. Start load = jisme last rep mushkil lage par form na bigde (RIR 2-3). Gym nahi hai to same days par: push-up, bodyweight squat, backpack row, glute bridge - 3 sets each.\n")
                    .append("Weeks 1-2: sirf form, light load, no failure. Week 3 se load badhao. Week 6: deload (aadhe sets, same exercises).\n")
                    .append("Cardio with this: 2 easy 20-25 min walks ya 1 easy run on Tue/Thu/Sat - strength days par long cardio nahi.");
        }
        return out.toString();
    }

    // ---------------------------------------------------------------- reality check

    private static final Pattern DAYS = Pattern.compile("(\\d{1,3})\\s*(?:days?|din)\\b");
    private static final Pattern PROTEIN_GRAMS = Pattern.compile("(?:(\\d{2,3})\\s*(?:g|gram|grams)\\s*protein|protein\\s*(\\d{2,3}))");
    private static final Pattern LOGGED_PROTEIN = Pattern.compile("diet avg \\d+ kcal / ([\\d.]+) g protein across (\\d+) logged days");
    private static final Pattern LOGGED_SESSIONS_1M = Pattern.compile("1M / 30 days:.*?workout sessions (\\d+)");
    private static final Pattern LOGGED_CARDIO_1M = Pattern.compile("1M / 30 days:.*?cardio ([\\d.]+) km / (\\d+) sessions");
    private static final Pattern LOGGED_WEIGHT_1M = Pattern.compile("1M / 30 days: weight ([\\d.]+) -> ([\\d.]+) kg \\(([+-][\\d.]+) kg\\)");

    /**
     * Deterministic no-sugarcoating layer: flags physiologically wrong premises with
     * exact math, confronts claims that contradict the user's own logs, and forces
     * cross-questions when a goal arrives without constraints.
     */
    private static String realityCheckBlock(String p, AiLiveContextService.LiveContext live) {
        List<String> flags = new ArrayList<>();
        List<String> contradictions = new ArrayList<>();
        List<String> questions = new ArrayList<>();
        double bodyWeight = live.weightLogged() ? live.protocolWeightKg() : 70.0;
        String profile = live.promptBlock() == null ? "" : live.promptBlock();

        // --- unsafe fat-loss timeline: > 0.75-1.0 kg/week is not a plan, it is a crash.
        double lost = requestedLossKg(p);
        double weeks = requestedWeeks(p);
        boolean fatLossAsk = lost > 0 || p.contains("fat loss") || p.contains("weight loss") || p.contains("patla");
        if (lost > 0 && weeks > 0) {
            double rate = lost / weeks;
            if (rate > 0.75) {
                double deficit = rate * 7700.0 / 7.0;
                double safeWeeksLo = Math.ceil(lost / (0.010 * bodyWeight));
                double safeWeeksHi = Math.ceil(lost / (0.005 * bodyWeight));
                flags.add("UNSAFE FAT-LOSS TIMELINE: user wants " + one(lost) + " kg in " + one(weeks) + " weeks = "
                        + one(rate) + " kg/week. That needs about " + Math.round(deficit) + " kcal/day deficit, which is crash territory: muscle loss, rebound, zero training quality. Safe rate is 0.5-1.0% body weight/week, so this goal honestly takes "
                        + (int) safeWeeksLo + "-" + (int) safeWeeksHi + " weeks. Say this in sentence 1, do not promise the user's date.");
            }
        }

        // --- spot-reduction myth.
        boolean spotMyth = p.contains("spot reduction") || p.contains("sirf pet") || p.contains("pet ka fat")
                || p.contains("belly fat kam") || p.contains("pet kam") || p.contains("face fat")
                || p.contains("thigh fat") || p.contains("arm fat") || (p.contains("abs") && (p.contains("crunch") || p.contains("exercise se")));
        if (spotMyth) {
            flags.add("SPOT-REDUCTION MYTH: fat cannot be removed from one body part by exercising it. Crunches build abs, they do not burn belly fat locally. Fat leaves from the whole body through a calorie deficit; the stubborn area is usually last. Sentence 1 must kill this myth directly.");
        }

        // --- low-protein muscle gain.
        boolean muscleAsk = p.contains("muscle") || p.contains("hypertrophy") || p.contains("mass gain")
                || p.contains("body banana") || p.contains("size badha");
        double claimedProtein = claimedProteinGrams(p);
        double loggedProtein = loggedProteinAvg(profile);
        double proteinFloor = bodyWeight * 1.4;
        if (muscleAsk && claimedProtein > 0 && claimedProtein < proteinFloor) {
            flags.add("LOW-PROTEIN MUSCLE GAIN: user plans about " + Math.round(claimedProtein) + " g protein/day = "
                    + one(claimedProtein / bodyWeight) + " g/kg. Muscle gain below 1.4 g/kg stalls; at " + one(bodyWeight)
                    + " kg the floor is " + Math.round(proteinFloor) + " g and the working target is "
                    + Math.round(bodyWeight * 1.6) + "-" + Math.round(bodyWeight * 2.0) + " g/day. No protein, no muscle - say it plainly.");
        }
        if (muscleAsk && loggedProtein > 0 && loggedProtein < proteinFloor) {
            contradictions.add("User wants muscle gain but logged protein averages only " + one(loggedProtein)
                    + " g/day (" + one(loggedProtein / bodyWeight) + " g/kg) over the last 30 days, below the 1.4 g/kg floor ("
                    + Math.round(proteinFloor) + " g). Training is not the bottleneck; food is.");
        }

        // --- ego lifting / skipping recovery.
        boolean recoveryAbuse = p.contains("no rest") || p.contains("rest nahi") || p.contains("roz heavy")
                || p.contains("daily heavy") || p.contains("har din same") || p.contains("bina rest")
                || p.contains("7 din gym") || p.contains("seven days gym");
        if (recoveryAbuse) {
            flags.add("RECOVERY ABUSE: training the same muscle heavy daily without rest does not build muscle faster; it buries recovery and stalls strength within weeks. Same muscle needs about 48 hours before hard work again. Sentence 1 must reject the no-rest plan.");
        }

        // --- claim vs log contradictions.
        int sessions1m = loggedSessions1m(profile);
        boolean claimsRegular = p.contains("roz workout") || p.contains("daily gym") || p.contains("regular hu")
                || p.contains("regular hoon") || p.contains("6 din") || p.contains("har din workout");
        if (claimsRegular && sessions1m >= 0 && sessions1m < 8) {
            contradictions.add("User claims regular training but only " + sessions1m + " workout sessions are logged in the last 30 days (under 2/week). Confront this gap with the exact count instead of praising consistency that is not in the logs.");
        }
        double[] cardio1m = loggedCardio1m(profile);
        boolean claimsRunning = p.contains("roz daud") || p.contains("daily run") || p.contains("running regular")
                || p.contains("stamina acha hai") || p.contains("stamina achha hai");
        if (claimsRunning && cardio1m != null && cardio1m[1] == 0) {
            contradictions.add("User claims regular running/stamina but zero cardio sessions are logged in the last 30 days. The stamina base is unproven until a run is logged.");
        }
        double weightChange1m = loggedWeightChange1m(profile);
        boolean claimsLosing = p.contains("weight kam ho raha") || p.contains("fat kam ho raha") || p.contains("progress ho raha");
        if (claimsLosing && !Double.isNaN(weightChange1m) && weightChange1m >= 0) {
            contradictions.add("User claims weight is dropping but logged weight changed " + String.format(Locale.ROOT, "%+.1f", weightChange1m)
                    + " kg over the last 30 days. The scale trend disagrees; judge by the 7-day average, not feelings.");
        }
        if (claimedProtein > 0 && loggedProtein > 0 && claimedProtein - loggedProtein >= 30) {
            contradictions.add("User claims about " + Math.round(claimedProtein) + " g protein/day but logged average is "
                    + one(loggedProtein) + " g/day. The gap is " + Math.round(claimedProtein - loggedProtein) + " g/day - name it.");
        }

        // --- cross-questions when constraints are missing.
        if (fatLossAsk && weeks <= 0) {
            questions.add("Kitne weeks me kitna kg kam karna hai, exact date batao - bina deadline ke plan sirf guess hoga.");
        }
        if (muscleAsk && claimedProtein <= 0 && loggedProtein <= 0) {
            questions.add("Roz protein kitna ja raha hai, grams me batao - bina protein number ke muscle plan banana andhere me teer hai.");
        }
        if ((p.contains("gym") || p.contains("workout")) && !p.contains("din") && !p.contains("days") && !p.contains("week")) {
            questions.add("Hafte me kitne din train kar sakte ho aur equipment kya hai - gym ya ghar? Isi se split decide hoga.");
        }
        if (questions.size() > 2) questions = questions.subList(0, 2);

        if (flags.isEmpty() && contradictions.isEmpty() && questions.isEmpty()) return "";
        StringBuilder out = new StringBuilder();
        if (!flags.isEmpty()) {
            out.append("[REALITY CHECK - the user's premise is wrong; verdictAndTimeline sentence 1 MUST start with \"Seedha sach:\" and state this directly, no softening]\n");
            flags.forEach(f -> out.append("- ").append(f).append("\n"));
        }
        if (!contradictions.isEmpty()) {
            out.append("[DATA CONTRADICTION ALERT - confront the user with these exact logged numbers]\n");
            contradictions.forEach(c -> out.append("- ").append(c).append("\n"));
        }
        if (!questions.isEmpty()) {
            out.append("[CROSS-QUESTIONS REQUIRED - ask these 1-2 sharp questions instead of blind generic advice]\n");
            questions.forEach(q -> out.append("- ").append(q).append("\n"));
        }
        return out.toString().trim();
    }

    private static double requestedLossKg(String p) {
        Matcher lose = LOSE.matcher(p);
        if (lose.find()) return number(lose.group(1));
        Matcher reversed = LOSE_REVERSED.matcher(p);
        if (reversed.find()) return number(reversed.group(1));
        Matcher range = FROM_TO.matcher(p);
        if (range.find()) return Math.abs(number(range.group(1)) - number(range.group(2)));
        return 0;
    }

    private static double requestedWeeks(String p) {
        Matcher weeks = WEEKS.matcher(p);
        if (weeks.find()) return number(weeks.group(1));
        Matcher months = MONTHS.matcher(p);
        if (months.find()) return number(months.group(1)) * 4.33;
        Matcher days = DAYS.matcher(p);
        if (days.find()) return number(days.group(1)) / 7.0;
        return 0;
    }

    private static double claimedProteinGrams(String p) {
        Matcher m = PROTEIN_GRAMS.matcher(p);
        if (!m.find()) return 0;
        return number(m.group(1) != null ? m.group(1) : m.group(2));
    }

    private static double loggedProteinAvg(String profile) {
        Matcher m = LOGGED_PROTEIN.matcher(profile);
        return m.find() ? number(m.group(1)) : 0;
    }

    private static int loggedSessions1m(String profile) {
        Matcher m = LOGGED_SESSIONS_1M.matcher(profile);
        return m.find() ? (int) number(m.group(1)) : -1;
    }

    private static double[] loggedCardio1m(String profile) {
        Matcher m = LOGGED_CARDIO_1M.matcher(profile);
        return m.find() ? new double[]{number(m.group(1)), number(m.group(2))} : null;
    }

    private static double loggedWeightChange1m(String profile) {
        Matcher m = LOGGED_WEIGHT_1M.matcher(profile);
        return m.find() ? number(m.group(3)) : Double.NaN;
    }

    // ---------------------------------------------------------------- parsing helpers

    private static double maxDistanceKm(String p) {
        Matcher m = KM.matcher(p);
        double best = 0;
        while (m.find()) best = Math.max(best, number(m.group(1)));
        return best;
    }

    private static double minutesFromPrompt(String p) {
        double minutes = 0;
        Matcher h = HOURS.matcher(p);
        if (h.find()) minutes += number(h.group(1)) * 60.0;
        Matcher m = MINUTES.matcher(p);
        if (m.find()) minutes += number(m.group(1));
        if (minutes <= 0) {
            Matcher sub = SUB_TIME.matcher(p);
            if (sub.find()) minutes = number(sub.group(1));
        }
        return minutes >= 10 && minutes <= 600 ? minutes : 0;
    }

    private static double paceFromPrompt(String p) {
        Matcher clock = CLOCK_PACE.matcher(p);
        if (clock.find()) return number(clock.group(1)) + number(clock.group(2)) / 60.0;
        Matcher word = WORD_PACE.matcher(p);
        if (word.find()) return number(word.group(1));
        return 0;
    }

    private static List<Double> allKg(String p) {
        List<Double> out = new ArrayList<>();
        Matcher m = KG.matcher(p);
        while (m.find()) out.add(number(m.group(1)));
        return out;
    }

    private static double number(String raw) {
        try {
            return Double.parseDouble(raw.replace(',', '.'));
        } catch (RuntimeException e) {
            return 0;
        }
    }

    private static String one(double value) {
        return String.format(Locale.ROOT, "%.1f", value);
    }

    /** 6.5 -> "6:30" for pace readability inside Hinglish copy. */
    private static String clock(double minutes) {
        int whole = (int) Math.floor(minutes);
        int sec = (int) Math.round((minutes - whole) * 60);
        if (sec == 60) {
            whole++;
            sec = 0;
        }
        return String.format(Locale.ROOT, "%d:%02d", whole, sec);
    }
}
