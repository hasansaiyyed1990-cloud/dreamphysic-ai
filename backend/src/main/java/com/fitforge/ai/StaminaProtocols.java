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

    // Compendium formula: kcal = MET * weightKg * (minutes / 60.0).
    private static double kcal(double met, double kg, double minutes) { return met * kg * (minutes / 60.0); }

    static String build(String prompt, double kg, boolean logged) {
        Matcher m = TARGET.matcher(prompt);
        int target = m.find() ? Math.max(100, Math.min(1500, Integer.parseInt(m.group(1)))) : 250;
        double runFixed = kcal(4.3, kg, 10);
        double runCycle = kcal(7.0, kg, 1) + kcal(4.3, kg, 1);
        int runRounds = Math.max(1, (int) Math.ceil(Math.max(0, target - runFixed) / runCycle));
        double runCalories = runFixed + runRounds * runCycle;
        double runKm = .4167 + .375 + runRounds * (.1333 + .0833);
        int runMinutes = 10 + runRounds * 2;

        double circuitFixed = kcal(4.3, kg, 7);
        // Four 45s work stations at 8 MET and four 15s recovery periods at 2 MET.
        double circuitRound = kcal(8.0, kg, 3) + kcal(2.0, kg, 1);
        int rounds = Math.max(1, (int) Math.ceil(Math.max(0, target - circuitFixed) / circuitRound));
        double circuitCalories = circuitFixed + rounds * circuitRound;
        int circuitMinutes = 7 + rounds * 4;
        String basis = logged ? String.format(Locale.ROOT, "using your logged %.1f kg body weight", kg) : "using a provisional 70 kg estimate (log your weight for personalization)";
        return "\n\n**Two beginner stamina options (Compendium MET estimates, " + basis + "; actual burn varies):**\n" +
                "**A) Outdoor/treadmill run-walk — target about " + target + " kcal.** 0:00–5:00 warm-up brisk walk 5 km/h (12:00/km; ~0.42 km, 4.3 MET). Then repeat " + runRounds + " rounds: 1 min easy jog 8 km/h (7:30/km; ~0.13 km, 7 MET) + 1 min brisk walk 5 km/h (12:00/km; ~0.08 km, 4.3 MET). Finish with 5 min cooldown brisk walk (4.3 MET). Total " + runMinutes + " min, ~" + String.format(Locale.ROOT, "%.2f", runKm) + " km, estimated " + Math.round(runCalories) + " kcal.\n" +
                "**B) Zero-equipment indoor circuit — target about " + target + " kcal.** Start with 4 min easy brisk march (4.3 MET). Then " + rounds + " rounds; each station 45 sec work / 15 sec rest: jumping jacks (or step jacks), high knees (or fast march), mountain climbers (hands elevated on a sturdy counter), step-ups on a stable low step; estimate work 8 MET, recovery 2 MET. Finish with 3 min easy brisk march. Total " + circuitMinutes + " min, estimated " + Math.round(circuitCalories) + " kcal.\n" +
                "These are alternative sessions; do not stack both to chase calories. If you are new, start with half the rounds and build over 2–3 weeks. A 700 kcal session is demanding for a beginner; consider splitting it across days, stop for chest pain/dizziness, and prioritize a sustainable pace.";
    }
}
