// Barrel for all DreamPhysic AI copy.
// Import from here so screens never reach into individual content files:
//   import { MEDICAL_DISCLAIMER, DAY_ONE_EMPTY_STATES } from '../content';
//
// Every user-facing string is an object of { en, hi } (hi = friendly Hinglish, Roman script).
// Pick a variant with `text[language] ?? text.en`.

export {
  CONTENT_VERSION,
  LAST_UPDATED,
  SUPPORTED_LANGUAGES,
  MEDICAL_DISCLAIMER,
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  PERMISSIONS_DISCLOSURE,
  LEGAL_DOCUMENTS,
} from "./legalContent.js";

export {
  DEFAULT_QUIET_HOURS,
  DAY_ONE_EMPTY_STATES,
  NOTIFICATION_TEMPLATES,
  NOTIFICATION_ORDER,
  SCIENCE_TOOLTIPS,
  SCIENCE_TOOLTIP_ORDER,
} from "./coachContent.js";
