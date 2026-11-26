// Coach voice copy: Day-1 empty states, smart reminder templates, and science tooltips.
// Every user-facing string is bilingual: `en` (English) and `hi` (friendly Hinglish, Roman script).
// Keep these short - they render in cards, drawers, and toasts.

export const CONTENT_VERSION = "1.0.0";

/** Defaults for the notification drawer. Times are 24h strings in the user's timezone. */
export const DEFAULT_QUIET_HOURS = {
  start: "23:00",
  end: "07:00",
  timezone: "Asia/Kolkata",
  label: { en: "Quiet Hours (23:00 - 07:00 IST)", hi: "Quiet Hours (23:00 - 07:00 IST)" },
  helper: {
    en: "No reminders arrive in this window. Change the times anytime in Settings.",
    hi: "Is window me koi reminder nahi aayega. Settings me time kabhi bhi badal sakte ho.",
  },
};

/**
 * Day-1 empty states. `Progress` has two slots (Body Scan and Weight Trend)
 * because both cards can be empty at the same time on a new account.
 * Shape: { title, subtitle, cta, secondaryCta? }
 */
export const DAY_ONE_EMPTY_STATES = {
  home: {
    id: "home-day-one",
    title: {
      en: "Day 1 starts with one tap",
      hi: "Day 1 sirf ek tap se shuru",
    },
    subtitle: {
      en: "Your plan is ready. Hit Start Workout and the coach will log every set as you go - no perfect day needed, just the first one.",
      hi: "Tumhara plan ready hai. Start Workout dabao aur coach har set log karta jayega - perfect day nahi chahiye, bas pehla din chahiye.",
    },
    cta: { en: "Start today's workout", hi: "Aaj ka workout shuru karo" },
    secondaryCta: { en: "See my plan", hi: "Mera plan dekho" },
  },
  progress: {
    id: "progress-day-one",
    title: { en: "No progress yet - good, that is Day 1", hi: "Abhi koi progress nahi - acha hai, ye Day 1 hai" },
    subtitle: {
      en: "Your graphs need a little data. Log weight once and finish one workout, and this screen starts telling your story.",
      hi: "Graphs ko thoda data chahiye. Ek baar weight log karo aur ek workout complete karo - phir ye screen tumhari story sunane lagegi.",
    },
    cta: { en: "Log today's weight", hi: "Aaj ka weight log karo" },
    secondaryCta: { en: "Open workout", hi: "Workout kholo" },
    bodyScan: {
      id: "body-scan-day-one",
      title: { en: "Your first Body Scan", hi: "Tumhara pehla Body Scan" },
      subtitle: {
        en: "Take one front photo today. It stays private to your account and becomes the baseline every future scan is compared against.",
        hi: "Aaj ek front photo lo. Ye sirf tumhare account me private rehti hai aur aage ke har scan ki baseline ban jaati hai.",
      },
      cta: { en: "Take first Body Scan", hi: "Pehla Body Scan lo" },
    },
    weightTrend: {
      id: "weight-trend-day-one",
      title: { en: "Trend unlocks after a few weigh-ins", hi: "Kuch weigh-ins ke baad trend khulega" },
      subtitle: {
        en: "One weight is a number; seven days of weights is a trend. Log mornings for a week and the line starts moving for real.",
        hi: "Ek weight ek number hai; saat din ka weight ek trend hai. Ek hafte subah weigh-in karo, line sach me move karegi.",
      },
      cta: { en: "Add today's weight", hi: "Aaj ka weight add karo" },
    },
  },
  workout: {
    id: "workout-day-one",
    title: { en: "No last-time data yet", hi: "Abhi last-time data nahi hai" },
    subtitle: {
      en: "This card becomes Last Time vs Now once you finish your first session - same exercises, same sets, so next week you can see the difference.",
      hi: "Pehla session complete karte hi ye card Last Time vs Now ban jayega - same exercises, same sets - taaki next week farq dikh jaye.",
    },
    cta: { en: "Start first session", hi: "Pehla session shuru karo" },
    secondaryCta: { en: "Preview the exercises", hi: "Exercises preview karo" },
    comparisonHint: {
      en: "Finish today's sets and we will store them as your baseline.",
      hi: "Aaj ke sets complete karo, hum unhe tumhari baseline bana denge.",
    },
  },
  cardio: {
    id: "cardio-day-one",
    title: { en: "No cardio logged yet", hi: "Abhi cardio log nahi hua" },
    subtitle: {
      en: "Pick a 10-minute walk, a treadmill session, or an outdoor run. Even a short one counts and starts your weekly cardio streak.",
      hi: "10 minute ki walk, treadmill session ya outdoor run chuno. Chhota bhi count hota hai aur weekly cardio streak shuru ho jaata hai.",
    },
    cta: { en: "Log a quick session", hi: "Ek quick session log karo" },
    secondaryCta: { en: "Start outdoor run", hi: "Outdoor run shuru karo" },
  },
  diet: {
    id: "diet-day-one",
    title: { en: "Nothing logged today", hi: "Aaj kuch log nahi hua" },
    subtitle: {
      en: "Log one meal - photo or search, your choice. One honest entry today is worth more than a perfect plan you never start.",
      hi: "Ek meal log karo - photo ya search, jo easy lage. Aaj ki ek sachhi entry us perfect plan se better hai jo kabhi shuru nahi hota.",
    },
    cta: { en: "Log first meal", hi: "Pehla meal log karo" },
    secondaryCta: { en: "Scan with camera", hi: "Camera se scan karo" },
  },
};

/**
 * Smart reminder templates, grouped by campaign. Each template is safe to send
 * as a local notification: `title` plus a short `body` with one clear action.
 * `defaultTime` is 24h local time; `quietAware: true` means the scheduler must
 * shift the send time out of DEFAULT_QUIET_HOURS instead of dropping it.
 */
export const NOTIFICATION_TEMPLATES = {
  MORNING_AUTOPILOT: {
    id: "morning-autopilot",
    label: { en: "Morning autopilot", hi: "Morning autopilot" },
    description: {
      en: "A short plan summary at the start of the day, so the workout is decided before the day gets busy.",
      hi: "Din shuru hote hi chhota plan summary, taaki workout ka decision din busy hone se pehle ho jaye.",
    },
    defaultTime: "07:00",
    quietAware: true,
    templates: [
      {
        id: "morning-plan-ready",
        title: { en: "Today's plan is ready", hi: "Aaj ka plan ready hai" },
        body: {
          en: "{workoutName} - about {durationMin} min. Tap to see the sets before you start.",
          hi: "{workoutName} - lagbhag {durationMin} min. Start se pehle sets dekh lo.",
        },
        cta: { en: "Open plan", hi: "Plan kholo" },
      },
      {
        id: "morning-rest-day",
        title: { en: "Recovery day - use it well", hi: "Recovery day - ise achhe se use karo" },
        body: {
          en: "No lifting today. Keep protein steady and take a 20-minute walk.",
          hi: "Aaj lifting nahi. Protein steady rakho aur 20 minute walk karo.",
        },
        cta: { en: "See recovery tips", hi: "Recovery tips dekho" },
      },
    ],
  },
  WORKOUT_NUDGE: {
    id: "workout-nudge",
    label: { en: "Workout nudge", hi: "Workout nudge" },
    description: {
      en: "One gentle nudge on planned training days, timed for when you usually train.",
      hi: "Planned training days par ek halka nudge, us time par jab tum usually train karte ho.",
    },
    defaultTime: "18:30",
    quietAware: true,
    templates: [
      {
        id: "nudge-session-waiting",
        title: { en: "20 minutes is enough today", hi: "Aaj 20 minute bhi kaafi hai" },
        body: {
          en: "{workoutName} is waiting. Finish the main lifts and skip the extras if time is short.",
          hi: "{workoutName} wait kar raha hai. Time kam hai to main lifts karo, extras skip kar do.",
        },
        cta: { en: "Start now", hi: "Abhi start karo" },
      },
      {
        id: "nudge-streak-protect",
        title: { en: "Keep the rhythm", hi: "Rhythm bana raho" },
        body: {
          en: "You trained {trainedDays} times this week. One session today keeps the week on track.",
          hi: "Is hafte {trainedDays} baar train kiya. Aaj ek session se hafta track par rahega.",
        },
        cta: { en: "Log a session", hi: "Session log karo" },
      },
    ],
  },
  HYDRATION_CHECK: {
    id: "hydration-check",
    label: { en: "Hydration check", hi: "Hydration check" },
    description: {
      en: "A midday water reminder, skipped automatically when you have already logged enough.",
      hi: "Dopahar ka paani reminder, jo pehle se kaafi log hone par apne aap skip ho jaata hai.",
    },
    defaultTime: "13:00",
    quietAware: true,
    templates: [
      {
        id: "hydration-behind",
        title: { en: "{remainingMl} ml to go", hi: "{remainingMl} ml baaki" },
        body: {
          en: "You are at {loggedMl} ml. One bottle now keeps the afternoon easy.",
          hi: "Abhi {loggedMl} ml ho gaya. Ek bottle abhi, dopahar aasan ho jayegi.",
        },
        cta: { en: "Log water", hi: "Paani log karo" },
      },
      {
        id: "hydration-hot-day",
        title: { en: "Hot day, extra sip", hi: "Garmi hai, extra sip" },
        body: {
          en: "Warmer than usual today - add a glass with your next meal.",
          hi: "Aaj zyada garmi hai - next meal ke saath ek glass extra.",
        },
        cta: { en: "Log water", hi: "Paani log karo" },
      },
    ],
  },
  PROTEIN_DINNER_CHECK: {
    id: "protein-dinner-check",
    label: { en: "Protein check before dinner", hi: "Dinner se pehle protein check" },
    description: {
      en: "An evening flag when protein is short, with Indian-food-friendly ways to close the gap.",
      hi: "Shaam ko flag jab protein kam ho, aur Indian khane se gap bharne ke easy options.",
    },
    defaultTime: "19:30",
    quietAware: true,
    templates: [
      {
        id: "protein-gap",
        title: { en: "{remainingG} g protein left", hi: "{remainingG} g protein baaki" },
        body: {
          en: "Paneer, dal, curd, or eggs can cover it at dinner. Tap for quick options.",
          hi: "Paneer, dal, curd ya eggs dinner me cover kar sakte hain. Quick options ke liye tap karo.",
        },
        cta: { en: "See options", hi: "Options dekho" },
      },
      {
        id: "protein-on-track",
        title: { en: "Protein is on track", hi: "Protein track par hai" },
        body: {
          en: "Nice - {loggedG} g logged. Keep dinner simple and finish the day strong.",
          hi: "Badhiya - {loggedG} g log hua. Dinner simple rakho aur din strong close karo.",
        },
        cta: { en: "Log dinner", hi: "Dinner log karo" },
      },
    ],
  },
  STREAK_SAVER: {
    id: "streak-saver",
    label: { en: "Streak saver", hi: "Streak saver" },
    description: {
      en: "One late-evening rescue message, only when the streak is at risk and something small can still save it.",
      hi: "Late evening ek rescue message, sirf jab streak risk me ho aur chhoti si cheez se bach sakti ho.",
    },
    defaultTime: "21:00",
    quietAware: true,
    templates: [
      {
        id: "streak-one-action",
        title: { en: "Your streak needs 5 minutes", hi: "Streak ko 5 minute chahiye" },
        body: {
          en: "{streakDays}-day streak. Log one set, one meal, or a short walk to keep it alive.",
          hi: "{streakDays} din ki streak. Ek set, ek meal ya chhoti walk log karo aur streak bacha lo.",
        },
        cta: { en: "Save streak", hi: "Streak bachao" },
      },
      {
        id: "streak-rest-counts",
        title: { en: "Rest day still counts", hi: "Rest day bhi count hota hai" },
        body: {
          en: "Planned rest keeps the streak. Mark today as rest instead of forcing a bad session.",
          hi: "Planned rest se streak chalti rehti hai. Jugaad wala session karne ki jagah aaj rest mark karo.",
        },
        cta: { en: "Mark as rest", hi: "Rest mark karo" },
      },
    ],
  },
};

/** Ordered list for the notification drawer, so UI order is not a side effect of object keys. */
export const NOTIFICATION_ORDER = [
  "MORNING_AUTOPILOT",
  "WORKOUT_NUDGE",
  "HYDRATION_CHECK",
  "PROTEIN_DINNER_CHECK",
  "STREAK_SAVER",
];

/**
 * Two-line explanations for the small "i" tooltips next to metrics.
 * `lines` always has exactly two short sentences - no paragraph dumps.
 */
export const SCIENCE_TOOLTIPS = {
  weightTrend: {
    id: "seven-day-average-weight",
    term: { en: "7-Day Average Weight Trend", hi: "7-Day Average Weight Trend" },
    lines: {
      en: [
        "Each point is the average of your last seven weigh-ins, not today's single reading.",
        "That smooths out water, salt, and creatine spikes so the real direction is visible.",
      ],
      hi: [
        "Har point tumhare last saat weigh-ins ka average hai, aaj ka single reading nahi.",
        "Isse paani, namak aur creatine ke spike smooth ho jaate hain aur asli direction dikhti hai.",
      ],
    },
  },
  warmupVsWorkingSets: {
    id: "warmup-vs-working-sets",
    term: { en: "Warm-up (W) vs Working Sets", hi: "Warm-up (W) vs Working Sets" },
    lines: {
      en: [
        "W sets are lighter prep sets to warm the joints; they are not counted in your volume.",
        "Only working sets are tracked for progress, so the bar keeps moving for the right reason.",
      ],
      hi: [
        "W sets halke prep sets hote hain jo joints warm karte hain; volume me count nahi hote.",
        "Progress sirf working sets se measure hota hai, taaki bar sahi wajah se badhe.",
      ],
    },
  },
  autopilotLowRecovery: {
    id: "autopilot-low-recovery",
    term: { en: "Autopilot Low-Recovery Volume Cut", hi: "Autopilot Low-Recovery Volume Cut" },
    lines: {
      en: [
        "When sleep, soreness, or missed sessions say you are under-recovered, Autopilot trims a set or two.",
        "The plan keeps the main lifts and drops the extras, so you still train without digging a deeper hole.",
      ],
      hi: [
        "Jab neend, soreness ya chhoote sessions batate hain ki recovery kam hai, Autopilot ek-do set kam kar deta hai.",
        "Main lifts rehte hain, extras hat jaate hain - training chalti rehti hai aur hole gehra nahi hota.",
      ],
    },
  },
  oilMultipliers: {
    id: "indian-cooking-oil-multipliers",
    term: { en: "Indian Cooking Oil Multipliers", hi: "Indian Cooking Oil Multipliers" },
    lines: {
      en: [
        "Home-style sabzi and dal carry hidden oil; the multiplier adds the usual ghee or oil per serving.",
        "It is an estimate by dish type, so adjust once if your family cooks lighter or heavier than average.",
      ],
      hi: [
        "Ghar ki sabzi aur dal me chhupa hua tel hota hai; multiplier per serving ka usual ghee/tel add karta hai.",
        "Ye dish type ke hisaab se estimate hai, isliye agar ghar me halka ya zyada tel padta hai to ek baar adjust kar lo.",
      ],
    },
  },
};

/** Ordered list for the "How it works" sheet on the Progress screen. */
export const SCIENCE_TOOLTIP_ORDER = [
  "weightTrend",
  "warmupVsWorkingSets",
  "autopilotLowRecovery",
  "oilMultipliers",
];
