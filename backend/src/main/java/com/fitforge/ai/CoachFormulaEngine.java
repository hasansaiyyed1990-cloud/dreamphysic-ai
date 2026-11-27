package com.fitforge.ai;

import com.fitforge.auth.AppUser;
import org.springframework.stereotype.Component;

import java.util.Locale;

/** Deterministic coaching arithmetic; unknown inputs remain explicitly unknown. */
@Component
public class CoachFormulaEngine {
    public String build(UserCoachContextBuilder.CoachContext context) {
        AppUser user = context.user();
        Double weight = context.weightLogged() ? context.weightKg() : null;
        Double bmr = bmr(user, weight);
        // Mixed-type ternary used to unbox a null bmr for brand-new users; keep the branches explicit.
        Double tdee;
        if (context.maintenanceCalories() > 0) tdee = Double.valueOf(context.maintenanceCalories());
        else if (bmr == null) tdee = null;
        else tdee = Double.valueOf(bmr * activityFactor(user.getActivityLevel()));
        StringBuilder out = new StringBuilder("[REQUIRED COACH MATH]\n");
        if (tdee != null) {
            double floor = bmr == null ? 1200 : Math.max(1200, bmr);
            out.append(String.format(Locale.ROOT, "Estimated TDEE %.0f kcal/day (%s); fat-loss intake target max(%.0f, TDEE - 400) = %.0f kcal/day. Do not reduce further.\n",
                    tdee, context.maintenanceCalories() > 0 ? "saved mission estimate" : "Mifflin-St Jeor BMR x profile activity factor", floor, Math.max(floor, tdee - 400)));
        } else out.append("TDEE/calorie target unavailable: age, height, weight, or activity estimate is missing; do not invent a number.\n");
        if (weight != null) out.append(String.format(Locale.ROOT, "Minimum daily protein target: %.0f g (1.7 g/kg x %.1f kg).\n", weight * 1.7, weight));
        else out.append("Protein grams target unavailable because current weight is not logged; ask for weight, then calculate 1.7 g/kg.\n");
        out.append("Verified pace arithmetic: 10 km in 60 min = ").append(pace(60, 10))
                .append(" min/km; 5 km in 25 min = ").append(pace(25, 5)).append(" min/km.\n");
        if (context.bestPaceMinPerKm() > 0 && context.maxDistanceKm() > 0) {
            double base = context.bestPaceMinPerKm();
            int weeks = timelineWeeks(context.maxDistanceKm());
            out.append(String.format(Locale.ROOT, "Logged best pace %.2f min/km across logged max %.1f km; conservative easy Zone-2 starting pace %.2f-%.2f min/km (keep conversational), interval pace only as short controlled efforts %.2f-%.2f min/km after warm-up.\n",
                    base, context.maxDistanceKm(), base + 1.0, base + 2.0, Math.max(1, base - .5), Math.max(1, base - .2)));
            out.append("Timeline estimate to build the next distance milestone: ").append(weeks)
                    .append("- ").append(weeks + 2).append(" weeks, based on logged longest distance and gradual pain-free progression; not a race-time guarantee.\n");
        } else {
            out.append("Running pace zones/timeline cannot be personalized: no valid run pace and distance are logged. Start with easy walk-jog intervals at conversational effort; record a comfortable baseline before prescribing pace intervals.\n");
        }
        out.append("Use exercise expenditure only as context; do not add it twice to TDEE.");
        return out.toString();
    }

    public static String pace(double minutes, double km) {
        if (minutes <= 0 || km <= 0) return "unavailable";
        double totalSeconds = minutes * 60.0 / km;
        int wholeMinutes = (int) (totalSeconds / 60);
        int seconds = (int) Math.round(totalSeconds - wholeMinutes * 60);
        if (seconds == 60) { wholeMinutes++; seconds = 0; }
        return String.format(Locale.ROOT, "%d:%02d", wholeMinutes, seconds);
    }

    private Double bmr(AppUser user, Double weight) {
        if (user == null || weight == null || user.getHeightCm() == null || user.getAgeYears() == null) return null;
        double base = 10 * weight + 6.25 * user.getHeightCm() - 5 * user.getAgeYears();
        String gender = user.getGender();
        if (gender == null) return null;
        if (gender.toUpperCase(Locale.ROOT).startsWith("M")) return base + 5;
        if (gender.toUpperCase(Locale.ROOT).startsWith("F")) return base - 161;
        return null;
    }

    private double activityFactor(String activity) {
        if (activity == null) return 1.2;
        return switch (activity.toUpperCase(Locale.ROOT)) {
            case "LIGHT", "LIGHTLY_ACTIVE" -> 1.375;
            case "MODERATE", "MODERATELY_ACTIVE" -> 1.55;
            case "ACTIVE", "VERY_ACTIVE" -> 1.725;
            case "EXTRA_ACTIVE" -> 1.9;
            default -> 1.2;
        };
    }

    private int timelineWeeks(double longestKm) {
        if (longestKm < 1) return 8;
        if (longestKm < 3) return 6;
        if (longestKm < 5) return 5;
        if (longestKm < 10) return 6;
        return 4;
    }
}
