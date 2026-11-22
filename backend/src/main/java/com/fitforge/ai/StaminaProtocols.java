package com.fitforge.ai;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class StaminaProtocols {
    private static final Pattern TARGET = Pattern.compile("(?i)(\\d{2,4})\\s*(?:kcal|calories?|cal)");
    private StaminaProtocols() {}

    static boolean applies(String prompt) {
        String p = prompt.toLowerCase(Locale.ROOT);
        return p.contains("calorie") || p.contains("kcal") || p.contains("burn") || p.contains("stamina") ||
                p.contains("cardio") || p.contains("running") || p.matches(".*\\brun\\b.*") || p.contains("jog") ||
                p.contains("treadmill") || p.contains("दौड़") || p.contains("दौड़");
    }

    static String build(String prompt, double kg, boolean logged) {
        Matcher m = TARGET.matcher(prompt);
        int target = m.find() ? Math.max(100, Math.min(1500, Integer.parseInt(m.group(1)))) : 250;
        double runFixed = .0175 * kg * (3.5 * 5 + 3.0 * 5);
        double runCycle = .0175 * kg * (8.3 + 3.5);
        int runRounds = Math.max(1, (int) Math.ceil(Math.max(0, target - runFixed) / runCycle));
        double runCalories = runFixed + runRounds * runCycle;
        double runKm = .4167 + .375 + runRounds * (.1333 + .0833);
        int runMinutes = 10 + runRounds * 2;

        double circuitFixed = .0175 * kg * (3.5 * 4 + 2.5 * 3);
        double circuitRound = .0175 * kg * (8.0 * 3 + 1.5);
        int rounds = Math.max(1, (int) Math.ceil(Math.max(0, target - circuitFixed) / circuitRound));
        double circuitCalories = circuitFixed + rounds * circuitRound;
        int circuitMinutes = 7 + rounds * 4;
        String basis = logged ? String.format(Locale.ROOT, "using your logged %.1f kg body weight", kg) : "using a provisional 70 kg estimate (log your weight for personalization)";
        return "\n\n**Two beginner stamina options (calorie estimates, " + basis + "; individual burn often varies by ~20%):**\n" +
                "**A) Outdoor/treadmill run-walk — target about " + target + " kcal.** 0:00–5:00 warm-up walk 5 km/h (12:00/km; ~0.42 km). Then repeat " + runRounds + " rounds: odd minute easy jog 8 km/h (7:30/km; ~0.13 km), even minute brisk walk 5 km/h (12:00/km; ~0.08 km). Finish with 5 min cooldown walk 4.5 km/h (13:20/km; ~0.38 km). Total " + runMinutes + " min, ~" + String.format(Locale.ROOT, "%.2f", runKm) + " km, estimated " + Math.round(runCalories) + " kcal.\n" +
                "**B) Zero-equipment indoor circuit — target about " + target + " kcal.** Start with 4 min easy march. Then " + rounds + " rounds; each station 45 sec work / 15 sec rest: jumping jacks (or step jacks), high knees (or fast march), mountain climbers (hands elevated on a sturdy counter), step-ups on a stable low step. Finish with 3 min easy walk/march. Total " + circuitMinutes + " min, estimated " + Math.round(circuitCalories) + " kcal.\n" +
                "These are alternative sessions; do not stack both to chase calories. If you are new, start with half the rounds and build over 2–3 weeks. A 700 kcal session is demanding for a beginner; consider splitting it across days, stop for chest pain/dizziness, and prioritize a sustainable pace.";
    }
}
