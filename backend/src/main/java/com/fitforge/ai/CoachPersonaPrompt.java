package com.fitforge.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Persona contract shared by coach endpoints. */
public final class CoachPersonaPrompt {
    public static final String SYSTEM_INSTRUCTION = """
            You are Dream Physic AI: Personal Trainer for Bodybuilding, a 10-Year Senior Indian Strength, Fat-Loss & Endurance Coach.
            Mirror the user's language: crisp natural Roman Hinglish for Hindi/Hinglish input; plain jargon-free English for English input. Be direct, practical and encouraging, never robotic or textbook-like.
            Use only facts in [ATHLETE LIVE PROFILE] and [USER_LIVE_COACH_CONTEXT]. Never invent stats. Diet preference and training experience are not stored: ask instead of assuming. If NEW_USER_NO_LOGS_YET appears, ask exactly two quick baseline questions but still give a safe Day-1 beginner plan using bodyweight/easy walk-jog and conservative effort.
            Explain any jargon immediately in simple words. Give concrete sets, reps, rest, loads only when logged or clearly labeled as a first-session starting estimate; running pace only when supported by logged data. Give realistic week ranges, not guaranteed dates. Use Indian foods and household portions.
            For any off-topic request, reply in one polite short Hinglish line redirecting to fitness.
            For normal coaching requests return ONLY valid JSON with keys: verdictAndTimeline (string), dataDiagnosis (string), stepByStepPlan (array of objects each with phaseOrDay, title, details, durationOrSets), indianDietRule (string), beginnerMistakeWarning (string), quickAction (object or null; optional actionType and payload). No markdown fences or extra keys. If asked for a photo or structured non-coach result, follow that endpoint's explicitly supplied JSON schema instead.
            Safety: no crash diets, punishment cardio, or exercise debt. Pending deficit is tracking only. Pain, illness, or poor recovery means stop/scale down and prioritize rest; recommend a clinician for acute pain/injury. Don't double count exercise calories in TDEE.
            """;

    private CoachPersonaPrompt() {}

    public static String compose(String request, String liveContext, String mathContext, String knowledge) {
        return "[ATHLETE LIVE PROFILE]\n" + liveContext + "\n[/ATHLETE LIVE PROFILE]\n"
                + (knowledge == null || knowledge.isBlank() ? "" : "[MATCHING FITNESS KNOWLEDGE]\n" + knowledge + "\n")
                + "[REQUIRED COACH MATH]\n" + mathContext + "\n[/REQUIRED COACH MATH]\n"
                + "Use these exact numbers inside verdictAndTimeline, dataDiagnosis and stepByStepPlan; label every assumption; never invent a different timeline, pace, weekly volume, deficit or protein number.\n"
                + "[USER_INPUT]\n" + request + "\n[/USER_INPUT]\n"
                + "Return the required coach JSON object now.";
    }

    /**
     * The coach contract is JSON, but every screen and endpoint renders plain Hinglish text.
     * Valid coach JSON is therefore turned into readable coaching copy; anything else passes through.
     */
    public static String normalizeOrFallback(String answer, ObjectMapper mapper) {
        if (answer == null || answer.isBlank()) return answer;
        try {
            int start = answer.indexOf('{');
            int end = answer.lastIndexOf('}');
            if (start < 0 || end < start) return answer;
            JsonNode root = mapper.readTree(answer.substring(start, end + 1));
            if (!root.isObject() || !root.has("verdictAndTimeline") || !root.has("dataDiagnosis")
                    || !root.path("stepByStepPlan").isArray() || !root.has("indianDietRule")
                    || !root.has("beginnerMistakeWarning")) return answer;
            return render(root);
        } catch (Exception ignored) {
            return answer;
        }
    }

    private static String render(JsonNode root) {
        StringBuilder out = new StringBuilder();
        out.append("**Coach's Verdict & Timeline:** ").append(text(root, "verdictAndTimeline")).append('\n');
        out.append("**Data Diagnosis:** ").append(text(root, "dataDiagnosis")).append('\n');
        out.append("**Kya Karna Hai (Step-by-Step Plan):**\n");
        for (JsonNode step : root.path("stepByStepPlan")) {
            String label = text(step, "phaseOrDay");
            String title = text(step, "title");
            String details = text(step, "details");
            String volume = text(step, "durationOrSets");
            out.append("- ");
            if (!label.isBlank()) out.append(label).append(" - ");
            out.append(title);
            if (!details.isBlank()) out.append(": ").append(details);
            if (!volume.isBlank()) out.append(" (").append(volume).append(')');
            out.append('\n');
        }
        out.append("**Indian Diet Rule:** ").append(text(root, "indianDietRule")).append('\n');
        out.append("**Beginner Mistake Warning:** ").append(text(root, "beginnerMistakeWarning"));
        return out.toString().trim();
    }

    private static String text(JsonNode node, String field) {
        return node.path(field).isMissingNode() || node.path(field).isNull() ? "" : node.path(field).asText("").trim();
    }
}
