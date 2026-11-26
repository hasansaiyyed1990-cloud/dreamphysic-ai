// Legal & transparency copy for DreamPhysic AI.
// Two languages per string: `en` (English) and `hi` (friendly Hinglish, Roman script).
// Keep every string plain text (no HTML) so it can render in <Text>, drawers, or a modal.

export const CONTENT_VERSION = "1.0.0";
export const LAST_UPDATED = "2026-11-26";

export const SUPPORTED_LANGUAGES = ["en", "hi"];

/**
 * The safety notice shown at onboarding, before a workout starts, and in Settings.
 * It must always be reachable from Settings > About > Medical Disclaimer.
 */
export const MEDICAL_DISCLAIMER = {
  id: "medical-disclaimer",
  version: CONTENT_VERSION,
  lastUpdated: LAST_UPDATED,
  title: {
    en: "Medical Disclaimer",
    hi: "Medical Disclaimer — ek baar padh lo",
  },
  summary: {
    en: "DreamPhysic AI is your fitness and nutrition coach, not a medical doctor. It cannot diagnose, treat, or cure any condition, and it does not replace advice from a qualified doctor, physiotherapist, or dietitian.",
    hi: "DreamPhysic AI tumhara fitness aur nutrition coach hai, doctor nahi. Ye kisi bimari ko diagnose ya treat nahi karta, aur qualified doctor, physiotherapist ya dietitian ki salah ka replacement nahi hai.",
  },
  keyPoints: [
    {
      id: "not-a-doctor",
      title: { en: "AI Coach is not a medical doctor", hi: "AI Coach doctor nahi hai" },
      body: {
        en: "Plans, calorie targets, and HR guidance are general fitness suggestions generated from what you tell us. They are not a clinical prescription. If a doctor has given you specific limits, follow the doctor — not the app.",
        hi: "Plans, calorie targets aur heart-rate guidance sab general fitness suggestions hain, jo tumhari di hui info se bante hain. Ye clinical prescription nahi hai. Agar doctor ne koi limit di hai to doctor ko follow karo, app ko nahi.",
      },
    },
    {
      id: "stop-on-pain",
      title: { en: "Stop rules: when to stop immediately", hi: "Stop rules: kab turant rukna hai" },
      body: {
        en: "Stop the set or session right away if you feel sharp or stabbing pain, joint pain that changes how you move, chest pain or pressure, breathlessness at rest, dizziness, fainting, or numbness. Rest, hydrate, and get medical help if it does not settle.",
        hi: "Turant set ya session rok do agar sharp/chubhne wala dard ho, joint pain jo movement badal de, chest pain ya pressure ho, aaram karte hue saans phool rahi ho, chakkar aaye, behoshi ho ya numbness ho. Rest karo, paani piyo, aur theek na lage to doctor se milo.",
      },
    },
    {
      id: "pain-vs-effort",
      title: { en: "Muscle effort is fine, pain is not", hi: "Muscle effort theek hai, pain nahi" },
      body: {
        en: "Burning in the muscle during a set is normal training effort. Pain in a joint, in the lower back, or pain that lasts more than 48 hours after a session is a signal to reduce load and get it checked.",
        hi: "Set ke andar muscle me burning hona normal effort hai. Joint me dard, lower back pain, ya session ke 48 ghante baad tak chalta dard — load kam karo aur check karwao.",
      },
    },
    {
      id: "pre-existing-conditions",
      title: { en: "Pre-existing conditions", hi: "Pehle se koi condition ho to" },
      body: {
        en: "If you are pregnant or postpartum, recovering from surgery or injury, or living with heart, blood pressure, diabetes, thyroid, kidney, asthma, or eating-disorder related conditions, clear the plan with your doctor before starting. Tell the coach in your profile notes so it can keep intensity conservative.",
        hi: "Agar tum pregnant ya postpartum ho, surgery/injury se recover kar rahe ho, ya heart, BP, diabetes, thyroid, kidney, asthma, ya eating-disorder jaisi condition hai — start karne se pehle doctor se clear karo. Profile notes me coach ko batao taaki wo intensity conservative rakhe.",
      },
    },
    {
      id: "estimated-metrics",
      title: { en: "Estimated, not medical, numbers", hi: "Numbers estimate hain, medical reading nahi" },
      body: {
        en: "Heart rate from a phone, watch, or band is an estimate. Calories burned, body-fat estimates, and the calorie targets we suggest are calculated from formulas and your logged data, so treat them as guidance with a margin of error, never as a medical measurement or a lab result.",
        hi: "Phone, watch ya band se aaya heart rate ek estimate hai. Burned calories, body-fat estimates aur suggested calorie targets formulas aur tumhare logged data se nikalte hain — inhe margin-of-error wali guidance samjho, medical measurement ya lab report nahi.",
      },
    },
    {
      id: "eating-and-supplements",
      title: { en: "Food, supplements, and extremes", hi: "Khana, supplements aur extreme cheezein" },
      body: {
        en: "We do not prescribe medication, steroids, or supplements, and we never suggest crash dieting, deliberate dehydration, or training through illness. For anything you swallow, ask a doctor or registered dietitian.",
        hi: "Hum medicine, steroids ya supplements prescribe nahi karte, aur crash dieting, jaan-boojh kar dehydration, ya bimar hoke training — kuch nahi suggest karte. Jo bhi khaate/peete ho, uske liye doctor ya registered dietitian se poocho.",
      },
    },
  ],
  emergency: {
    en: "In an emergency (chest pain, severe breathlessness, fainting, or a suspected fracture) call local emergency services immediately — in India dial 112. Do not wait for the app.",
    hi: "Emergency me (chest pain, bahut zyada saans phoolna, behoshi, ya fracture ka shak) turant local emergency services ko call karo — India me 112. App ka intezaar mat karo.",
  },
  acknowledgeLabel: {
    en: "I understand this is fitness guidance, not medical advice",
    hi: "Samajh gaya — ye fitness guidance hai, medical advice nahi",
  },
};

/**
 * Terms of Service, written for an Indian app that also serves global users.
 * Render `sections` in order; each section is safe to deep-link by `id`.
 */
export const TERMS_OF_SERVICE = {
  id: "terms-of-service",
  version: CONTENT_VERSION,
  lastUpdated: LAST_UPDATED,
  title: { en: "Terms of Service", hi: "Terms of Service" },
  intro: {
    en: "These terms are the agreement between you and DreamPhysic AI for using the app, the AI coach, and the related services. By creating an account or continuing to use the app, you accept them.",
    hi: "Ye terms tumhare aur DreamPhysic AI ke beech app, AI coach aur related services use karne ka agreement hai. Account bana ke ya app use karte rehkar tum inhe accept karte ho.",
  },
  sections: [
    {
      id: "acceptance",
      heading: { en: "1. Accepting these terms", hi: "1. Ye terms accept karna" },
      body: {
        en: "You must be at least 18 years old, or using the app with the consent and supervision of a parent or legal guardian, to create an account. If you do not agree with these terms, please stop using the app and delete your account.",
        hi: "Account banane ke liye tumhari age kam se kam 18 honi chahiye, ya parent/guardian ki consent aur supervision me app use kar rahe ho. Agar ye terms pasand nahi to app use band karo aur account delete kar do.",
      },
    },
    {
      id: "safety",
      heading: { en: "2. Health, safety, and eligibility", hi: "2. Health, safety aur eligibility" },
      body: {
        en: "Training and diet changes carry risk. You confirm that you are fit enough to exercise, that you have disclosed relevant conditions in your profile, and that you have cleared the plan with a doctor where needed. The Medical Disclaimer is part of these terms and applies to every plan, metric, and suggestion the app shows.",
        hi: "Training aur diet changes me risk hota hai. Tum confirm karte ho ki tum exercise ke liye fit ho, relevant conditions profile me bata di hain, aur jahan zaroori tha wahan doctor se clearance li hai. Medical Disclaimer in terms ka hissa hai aur app ke har plan, metric aur suggestion par lagta hai.",
      },
    },
    {
      id: "ai-coach",
      heading: { en: "3. How the AI coach works", hi: "3. AI coach kaise kaam karta hai" },
      body: {
        en: "The AI coach generates plans, replies, and adjustments from the data you log and from general fitness knowledge. Output can be incomplete or wrong, and the same input may produce different wording over time. You stay responsible for what you actually do in the gym, on the road, and in the kitchen.",
        hi: "AI coach tumhare logged data aur general fitness knowledge se plans, replies aur adjustments banata hai. Output adhoora ya galat ho sakta hai, aur same input par wording badal sakti hai. Gym, road aur kitchen me actually kya karna hai — uski responsibility tumhari hai.",
      },
    },
    {
      id: "account-security",
      heading: { en: "4. Your account and session security", hi: "4. Account aur session security" },
      body: {
        en: "You are responsible for keeping your login details private. Sessions use short-lived JWT access tokens that are stored on your device and sent as a Bearer token on each request; they are cleared when you log out, when the token expires, or when the server rejects it. Tell us immediately if you suspect someone else is using your account.",
        hi: "Login details private rakhna tumhari zimmedari hai. Session short-lived JWT access token use karta hai jo device par store hota hai aur har request me Bearer token ki tarah bhejta hai; logout, token expiry ya server reject par wo clear ho jata hai. Agar lage ki koi aur tumhara account use kar raha hai to turant batao.",
      },
    },
    {
      id: "your-content",
      heading: { en: "5. Body Scan photos and your content", hi: "5. Body Scan photos aur tumhara content" },
      body: {
        en: "Body Scan photos, meal photos, weight entries, and notes are yours. You give us only the limited permission needed to store them and show them back to you, run the AI analysis you request, and keep the service working. We do not use your photos in ads, do not publish them, and do not sell them. Delete a photo or your account and the associated files are removed as described in the Privacy Policy.",
        hi: "Body Scan photos, meal photos, weight entries aur notes tumhare hain. Tum hume sirf itni limited permission dete ho ki hum unhe store kar ke tumhe dikha sakein, jo AI analysis tum maango wo chala sakein, aur service chalti rahe. Hum photos ads me use nahi karte, publish nahi karte, bechte nahi. Photo ya account delete karne par files Privacy Policy ke hisaab se hata di jaati hain.",
      },
    },
    {
      id: "location",
      heading: { en: "6. Location and outdoor activity", hi: "6. Location aur outdoor activity" },
      body: {
        en: "GPS tracking for outdoor runs and rides is approximate and can drift in tunnels, dense buildings, or poor weather. Follow traffic rules, stay aware of your surroundings, and do not look at the screen while moving. Outdoor distance and pace are training estimates, not certified measurements.",
        hi: "Outdoor run aur ride ka GPS tracking approximate hai aur tunnel, dense buildings ya kharab mausam me drift kar sakta hai. Traffic rules follow karo, surroundings par dhyan rakho, aur chalte-firte screen mat dekho. Outdoor distance aur pace training estimates hain, certified measurements nahi.",
      },
    },
    {
      id: "acceptable-use",
      heading: { en: "7. Acceptable use", hi: "7. Kya allowed hai, kya nahi" },
      body: {
        en: "Do not upload photos of other people without their consent, attempt to break, scrape, or overload the service, reverse engineer protected parts, resell access, or use the coach to get medical, legal, or emergency help. We may suspend accounts that put other users or the service at risk.",
        hi: "Kisi aur ki photo unki consent ke bina upload mat karo, service ko break/scrape/overload karne ki koshish mat karo, protected parts reverse engineer mat karo, access resell mat karo, aur coach se medical, legal ya emergency help mat maango. Doosre users ya service ko risk me daalne wale accounts suspend ho sakte hain.",
      },
    },
    {
      id: "plans-and-payments",
      heading: { en: "8. Plans and payments", hi: "8. Plans aur payments" },
      body: {
        en: "Any paid plan, trial, or price is shown in the app or store listing before you buy, and store purchases are billed and refunded under that store's rules (for example Google Play or the App Store). Free features can change over time, and we will tell you in the app before a free feature becomes paid.",
        hi: "Koi bhi paid plan, trial ya price kharidne se pehle app ya store listing me dikhta hai, aur store purchases us store ke rules (jaise Google Play ya App Store) par bill aur refund hote hain. Free features time ke saath badal sakte hain, aur free feature paid hone se pehle hum app me bata denge.",
      },
    },
    {
      id: "notifications",
      heading: { en: "9. Notifications and reminders", hi: "9. Notifications aur reminders" },
      body: {
        en: "Smart reminders are optional and stay inside your Quiet Hours (23:00 to 07:00 IST by default) unless you change them. You can turn any reminder type off in Settings, and turning notifications off never blocks you from using the app.",
        hi: "Smart reminders optional hain aur tumhare Quiet Hours (default 23:00 se 07:00 IST) ke andar rehte hain, jab tak tum badal na do. Settings me koi bhi reminder type off kar sakte ho, aur notifications off karne se app use karne me koi rok nahi aati.",
      },
    },
    {
      id: "intellectual-property",
      heading: { en: "10. Our content", hi: "10. Hamara content" },
      body: {
        en: "The app, its design, exercise library, coaching logic, and written content belong to DreamPhysic AI and its licensors. You get a personal, non-transferable licence to use the app for your own training. Do not copy or redistribute the coaching content commercially.",
        hi: "App, uska design, exercise library, coaching logic aur written content DreamPhysic AI aur uske licensors ka hai. Tumhe apni training ke liye personal, non-transferable licence milta hai. Coaching content ko commercially copy ya redistribute mat karo.",
      },
    },
    {
      id: "deletion",
      heading: { en: "11. Deleting your account", hi: "11. Account delete karna" },
      body: {
        en: "You can permanently delete your account and its data from Settings in one tap, or with a DELETE request to /api/user/account. Deletion removes your profile, plans, logs, and Body Scan photos and cannot be undone. Keep any data you want to retain before you delete.",
        hi: "Settings se ek tap me apna account aur uska data permanently delete kar sakte ho, ya /api/user/account par DELETE request bhej sakte ho. Deletion se profile, plans, logs aur Body Scan photos hat jaate hain aur wo undo nahi hota. Jo data rakhna hai pehle save kar lo.",
      },
    },
    {
      id: "liability",
      heading: { en: "12. Disclaimers and liability", hi: "12. Disclaimers aur liability" },
      body: {
        en: "The app is provided as-is and as-available, without a warranty that it will always be correct or uninterrupted. To the extent the law allows, DreamPhysic AI is not liable for injury, loss, or damage arising from training decisions, missed medical care, or service interruptions. Nothing here limits rights you have under mandatory Indian consumer law.",
        hi: "App as-is aur as-available milta hai, aur koi warranty nahi ki wo hamesha sahi ya bina rukawat chalega. Jahan tak law allow karta hai, DreamPhysic AI training decisions, chhooti medical care, ya service interruption se hui injury, loss ya damage ke liye liable nahi hai. Ye mandatory Indian consumer law ke tumhare rights ko limit nahi karta.",
      },
    },
    {
      id: "changes",
      heading: { en: "13. Changes to these terms", hi: "13. In terms me changes" },
      body: {
        en: "We may update these terms as the app changes. Material changes are shown in the app before they take effect, and the date at the top of this page always reflects the current version. Continuing to use the app after a change means you accept the updated terms.",
        hi: "App badalne ke saath hum ye terms update kar sakte hain. Bade changes lagu hone se pehle app me dikhaye jaate hain, aur is page ke top par date hamesha current version batati hai. Change ke baad app use karte rehna matlab updated terms accept.",
      },
    },
    {
      id: "law-and-contact",
      heading: { en: "14. Governing law and contact", hi: "14. Governing law aur contact" },
      body: {
        en: "These terms are governed by the laws of India, with courts in India having jurisdiction over disputes. Questions about these terms can be sent to support@dreamphysic.ai and we aim to reply within 7 working days.",
        hi: "Ye terms India ke laws se govern hote hain, aur disputes par India ke courts ka jurisdiction hoga. Terms se juda koi sawaal support@dreamphysic.ai par bhejo — hum 7 working days me reply karne ki koshish karte hain.",
      },
    },
  ],
};

/**
 * Privacy Policy. Written to be honest about what the app actually does:
 * private Body Scan storage, JWT sessions, no selling of health data,
 * one-tap permanent deletion.
 */
export const PRIVACY_POLICY = {
  id: "privacy-policy",
  version: CONTENT_VERSION,
  lastUpdated: LAST_UPDATED,
  title: { en: "Privacy Policy", hi: "Privacy Policy" },
  intro: {
    en: "This policy explains what DreamPhysic AI collects, why, where it is stored, and how you can remove it. Short version: your health data is used to coach you, never sold and never used for advertising.",
    hi: "Ye policy batati hai ki DreamPhysic AI kya collect karta hai, kyun, kahan store hota hai, aur tum kaise hata sakte ho. Short version: tumhara health data sirf coaching ke liye use hota hai — becha nahi jaata, ads me nahi lagta.",
  },
  highlights: [
    {
      id: "no-selling",
      title: { en: "We never sell health data", hi: "Health data kabhi bechte nahi" },
      body: {
        en: "Weight, body measurements, food logs, workout history, and Body Scan photos are not sold, rented, or traded to advertisers, insurers, or data brokers.",
        hi: "Weight, body measurements, food logs, workout history aur Body Scan photos advertisers, insurers ya data brokers ko beche, rent ya trade nahi kiye jaate.",
      },
    },
    {
      id: "private-photos",
      title: { en: "Body Scan photos stay private", hi: "Body Scan photos private rehti hain" },
      body: {
        en: "Photos are stored in a private bucket tied to your account, served only to your own logged-in session, and never shown to other users.",
        hi: "Photos tumhare account se juda private bucket me store hoti hain, sirf tumhare logged-in session ko milti hain, aur doosre users ko kabhi nahi dikhti.",
      },
    },
    {
      id: "one-tap-delete",
      title: { en: "Delete everything in one tap", hi: "Ek tap me sab delete" },
      body: {
        en: "Settings > Delete account, or DELETE /api/user/account, permanently removes your profile, plans, logs, and photos. No email or support ticket needed.",
        hi: "Settings > Delete account, ya DELETE /api/user/account, tumhara profile, plans, logs aur photos permanently hata deta hai. Koi email ya support ticket ki zaroorat nahi.",
      },
    },
  ],
  sections: [
    {
      id: "scope",
      heading: { en: "1. Who this policy covers", hi: "1. Ye policy kiske liye hai" },
      body: {
        en: "This policy covers the DreamPhysic AI mobile app and web app, including the AI coach, workout and cardio tracking, diet logging, and Body Scan features. It applies to users in India and in other countries where the app is available.",
        hi: "Ye policy DreamPhysic AI mobile aur web app par lagti hai — AI coach, workout aur cardio tracking, diet logging aur Body Scan features sab included. Ye India aur jahan app available hai wahan ke users par lagti hai.",
      },
    },
    {
      id: "data-we-collect",
      heading: { en: "2. Data we collect", hi: "2. Hum kya data collect karte hain" },
      body: {
        en: "Account data (name, email, hashed password, login timestamps), profile data you enter (age, height, weight, goals, activity level, equipment, conditions you choose to share), training and diet logs, app settings, and technical data such as device type and error logs needed to keep the service running.",
        hi: "Account data (naam, email, hashed password, login timestamps), tumhari di hui profile (age, height, weight, goals, activity level, equipment, jo conditions tum share karna chaho), training aur diet logs, app settings, aur service chalane ke liye zaroori technical data jaise device type aur error logs.",
      },
    },
    {
      id: "body-scan",
      heading: { en: "3. Body Scan photos", hi: "3. Body Scan photos" },
      body: {
        en: "Body Scan photos are uploaded over HTTPS, stored privately against your user ID, and referenced by an internal file key rather than a public link. Access is limited to your authenticated session and to the analysis step you request. Photos are not used to train third-party models and are not included in any public profile or leaderboard.",
        hi: "Body Scan photos HTTPS par upload hoti hain, tumhare user ID ke against privately store hoti hain, aur public link ki jagah internal file key se reference hoti hain. Access sirf tumhare authenticated session aur tumhare maange analysis tak limited hai. Photos third-party models train karne me use nahi hoti aur kisi public profile ya leaderboard me nahi jaati.",
      },
    },
    {
      id: "how-we-use",
      heading: { en: "4. How we use your data", hi: "4. Data ka use kaise karte hain" },
      body: {
        en: "To build and adjust your plans, calculate trends such as your 7-day average weight, show your progress, send the reminders you enable, keep your session secure, fix bugs, and meet legal obligations. We do not use your health data for advertising and we do not build advertising profiles.",
        hi: "Plans banane aur adjust karne, 7-day average weight jaise trends nikalne, progress dikhane, tumhare on kiye reminders bhejne, session secure rakhne, bugs fix karne aur legal requirements poori karne ke liye. Health data ads ke liye use nahi hota aur hum advertising profiles nahi banate.",
      },
    },
    {
      id: "no-selling",
      heading: { en: "5. We do not sell your health data", hi: "5. Health data sell nahi hota" },
      body: {
        en: "We do not sell, rent, or trade personal or health data. We do not share Body Scan photos, food logs, or workout history with advertisers, insurers, employers, or data brokers, and we do not send health data to ad networks or social pixels.",
        hi: "Hum personal ya health data bechte, rent ya trade nahi karte. Body Scan photos, food logs ya workout history advertisers, insurers, employers ya data brokers ke saath share nahi hoti, aur health data ad networks ya social pixels ko nahi jaata.",
      },
    },
    {
      id: "session-security",
      heading: { en: "6. Session and account security", hi: "6. Session aur account security" },
      body: {
        en: "Passwords are stored only as salted hashes, never in plain text. After login the server issues a signed JWT that your device sends as a Bearer token; traffic is encrypted with HTTPS/TLS. The token is removed from your device on logout and whenever the server returns 401, and expired or tampered tokens are rejected server-side.",
        hi: "Passwords sirf salted hash ki tarah store hote hain, plain text me kabhi nahi. Login ke baad server signed JWT deta hai jo tumhara device Bearer token ki tarah bhejta hai; traffic HTTPS/TLS se encrypted rehta hai. Logout par aur jab bhi server 401 de, token device se hat jata hai, aur expired ya tampered tokens server par reject hote hain.",
      },
    },
    {
      id: "local-storage",
      heading: { en: "7. Data kept on your device", hi: "7. Device par rakha data" },
      body: {
        en: "Your session token, theme and unit preferences, and offline gym drafts (in-progress workout entries) are stored in your browser or app local storage so the app works with a weak connection. Drafts sync when you are back online. Clearing app data or logging out removes the token; uninstalling the app removes all local copies.",
        hi: "Session token, theme aur unit preferences, aur offline gym drafts (adhe bhare workout entries) tumhare browser ya app ke local storage me rehte hain taaki kharab network par bhi app chale. Online aane par drafts sync ho jaate hain. App data clear karne ya logout karne par token hat jata hai; app uninstall karne par saari local copies chali jaati hain.",
      },
    },
    {
      id: "sharing",
      heading: { en: "8. Who can see your data", hi: "8. Tumhara data kaun dekh sakta hai" },
      body: {
        en: "Only you, plus service providers who host the servers, database, and file storage under contracts that limit them to running the service. We may disclose data if Indian law or a valid legal order requires it, and we will tell you unless we are legally barred from doing so.",
        hi: "Sirf tum, aur wo service providers jo servers, database aur file storage host karte hain — unke contracts unhe sirf service chalane tak limit karte hain. Agar Indian law ya valid legal order maange to data disclose kar sakte hain, aur jab tak legally mana na ho hum tumhe batayenge.",
      },
    },
    {
      id: "retention",
      heading: { en: "9. How long we keep data", hi: "9. Data kitne din rakhte hain" },
      body: {
        en: "Account, training, and diet data stay while your account exists. Deleted Body Scan photos are removed from active storage immediately and from backups within 30 days. Minimal billing or security records may be kept longer where tax or fraud-prevention law requires it.",
        hi: "Account, training aur diet data tab tak rehta hai jab tak account hai. Delete ki hui Body Scan photos active storage se turant aur backups se 30 din ke andar hat jaati hain. Tax ya fraud-prevention law jahan maange wahan minimal billing ya security records zyada din rakh sakte hain.",
      },
    },
    {
      id: "your-rights",
      heading: { en: "10. Access, correction, and permanent deletion", hi: "10. Access, correction aur permanent deletion" },
      body: {
        en: "You can view and edit your profile and logs in the app, and delete your account and all associated data in one tap from Settings > Delete account, or by calling DELETE /api/user/account with your session token. Deletion is permanent, so export anything you want to keep first. You can also write to support@dreamphysic.ai for access or correction requests.",
        hi: "Tum app me apna profile aur logs dekh aur edit kar sakte ho, aur Settings > Delete account se ek tap me account aur uska saara data delete kar sakte ho, ya session token ke saath DELETE /api/user/account call kar sakte ho. Deletion permanent hai, isliye jo rakhna hai pehle export kar lo. Access ya correction ke liye support@dreamphysic.ai par bhi likh sakte ho.",
      },
    },
    {
      id: "permissions",
      heading: { en: "11. Device permissions", hi: "11. Device permissions" },
      body: {
        en: "Camera, location, and notification access are requested only when you use the feature that needs them, and each one can be revoked in your device settings. Text of each disclosure is in the app's Permissions screen; declining a permission only disables that feature.",
        hi: "Camera, location aur notification access tab maanga jaata hai jab tum wo feature use karte ho, aur har ek device settings me revoke ho sakti hai. Har disclosure ka text app ki Permissions screen me hai; permission na dene par sirf wahi feature band hota hai.",
      },
    },
    {
      id: "children",
      heading: { en: "12. Children", hi: "12. Bacche" },
      body: {
        en: "The app is not directed at children under 13, and accounts for users under 18 need parent or guardian consent. If we learn that a child under 13 created an account, we delete it.",
        hi: "App 13 saal se chhote bachchon ke liye nahi hai, aur 18 se kam users ke account ke liye parent/guardian consent chahiye. Agar pata chale ki 13 se kam umar ke bachche ne account banaya hai, hum use delete kar dete hain.",
      },
    },
    {
      id: "transfers",
      heading: { en: "13. International transfers", hi: "13. International transfers" },
      body: {
        en: "Our hosting and storage providers may process data outside India. Where that happens, transfers rely on appropriate safeguards and the same protections described in this policy, and we keep the data set minimal.",
        hi: "Hamare hosting aur storage providers India ke bahar data process kar sakte hain. Aisa hone par transfers appropriate safeguards aur is policy me batayi same protections par depend karte hain, aur hum data minimal rakhte hain.",
      },
    },
    {
      id: "changes",
      heading: { en: "14. Changes to this policy", hi: "14. Policy me changes" },
      body: {
        en: "If this policy changes in a meaningful way, we show a notice in the app before the change takes effect and update the date at the top. Past versions are available on request.",
        hi: "Agar is policy me meaningful change hota hai to lagu hone se pehle app me notice dikhate hain aur top ki date update karte hain. Purane versions request par mil sakte hain.",
      },
    },
    {
      id: "contact",
      heading: { en: "15. Contact", hi: "15. Contact" },
      body: {
        en: "Privacy questions and requests: support@dreamphysic.ai. We aim to respond within 7 working days, and within the timelines Indian data protection law requires.",
        hi: "Privacy sawaal aur requests: support@dreamphysic.ai. Hum 7 working days me reply karne ki koshish karte hain, aur Indian data protection law ki timelines ke andar.",
      },
    },
  ],
};

/**
 * Plain-language permission prompts. Show `why` before the OS dialog,
 * and `ifDenied` after a "Don't allow" so the user is never stuck.
 */
export const PERMISSIONS_DISCLOSURE = {
  camera: {
    id: "camera",
    label: { en: "Camera", hi: "Camera" },
    why: {
      en: "Used for Food Scan (snap a meal to log it) and Body Scan (progress photos for your own comparison). Photos are taken only when you tap the shutter.",
      hi: "Food Scan (khane ki photo se log karna) aur Body Scan (apne comparison ke liye progress photos) ke liye. Photo sirf tab banti hai jab tum shutter tap karte ho.",
    },
    usedFor: ["food-scan", "body-scan"],
    ifDenied: {
      en: "You can still log meals by search or by typing macros, and Body Scan stays available once you allow camera access in Settings.",
      hi: "Bina camera ke bhi meals search ya macros type karke log kar sakte ho, aur Settings me camera allow karte hi Body Scan chalu ho jayega.",
    },
    revokeHint: {
      en: "Revoke anytime: phone Settings > Apps > DreamPhysic AI > Permissions > Camera.",
      hi: "Kabhi bhi band karo: phone Settings > Apps > DreamPhysic AI > Permissions > Camera.",
    },
  },
  location: {
    id: "location",
    label: { en: "Location (GPS)", hi: "Location (GPS)" },
    why: {
      en: "Used only during an Outdoor Run or Outdoor Cycle to draw your route and measure distance and pace. Tracking starts when you press Start and stops when you press Finish.",
      hi: "Sirf Outdoor Run ya Outdoor Cycle ke time route draw karne aur distance/pace naapne ke liye. Tracking Start dabane par chalu aur Finish dabane par band ho jaati hai.",
    },
    usedFor: ["outdoor-run", "outdoor-cycle"],
    ifDenied: {
      en: "Indoor cardio, treadmill, and manual distance entry keep working; only the map and route preview are unavailable.",
      hi: "Indoor cardio, treadmill aur manual distance entry chalti rahegi; sirf map aur route preview nahi milega.",
    },
    revokeHint: {
      en: "Revoke anytime: phone Settings > Apps > DreamPhysic AI > Permissions > Location.",
      hi: "Kabhi bhi band karo: phone Settings > Apps > DreamPhysic AI > Permissions > Location.",
    },
  },
  notifications: {
    id: "notifications",
    label: { en: "Notifications", hi: "Notifications" },
    why: {
      en: "Used for the smart reminders you switch on - morning autopilot, workout nudge, hydration, protein check, and streak saver - kept inside your Quiet Hours (23:00-07:00 IST by default).",
      hi: "Sirf tumhare on kiye smart reminders ke liye - morning autopilot, workout nudge, hydration, protein check aur streak saver - aur wo tumhare Quiet Hours (default 23:00-07:00 IST) ke andar rehte hain.",
    },
    usedFor: ["reminders", "streak-saver", "quiet-hours"],
    ifDenied: {
      en: "Everything else keeps working; reminders simply do not arrive and the same prompts appear in-app instead.",
      hi: "Baaki sab chalta rahega; bas reminders nahi aayenge aur wahi prompts app ke andar dikhenge.",
    },
    revokeHint: {
      en: "Revoke anytime: phone Settings > Apps > DreamPhysic AI > Notifications, or turn individual reminders off in-app.",
      hi: "Kabhi bhi band karo: phone Settings > Apps > DreamPhysic AI > Notifications, ya app me individual reminders off kar do.",
    },
  },
  storage: {
    id: "storage",
    label: { en: "Local storage", hi: "Local storage" },
    why: {
      en: "Keeps your session signed in, remembers your theme and units, and saves offline gym drafts so a weak signal does not lose a set you already finished.",
      hi: "Session signed-in rakhta hai, theme aur units yaad rakhta hai, aur offline gym drafts save karta hai taaki kharab signal par kiya hua set waste na jaye.",
    },
    usedFor: ["session-token", "preferences", "offline-drafts"],
    ifDenied: {
      en: "The app still works but you will be signed out more often and in-progress workouts will not survive a page reload offline.",
      hi: "App chalega, par tum jaldi-jaldi sign out ho jaoge aur offline page reload par adhe bhare workouts nahi bachenge.",
    },
    revokeHint: {
      en: "Clear it anytime from browser or app settings; logging out removes the session token immediately.",
      hi: "Kabhi bhi browser ya app settings se clear karo; logout karne par session token turant hat jata hai.",
    },
  },
};

/** Everything needed to render Settings > Legal in one place. */
export const LEGAL_DOCUMENTS = [
  { id: MEDICAL_DISCLAIMER.id, title: MEDICAL_DISCLAIMER.title, document: MEDICAL_DISCLAIMER },
  { id: TERMS_OF_SERVICE.id, title: TERMS_OF_SERVICE.title, document: TERMS_OF_SERVICE },
  { id: PRIVACY_POLICY.id, title: PRIVACY_POLICY.title, document: PRIVACY_POLICY },
];
