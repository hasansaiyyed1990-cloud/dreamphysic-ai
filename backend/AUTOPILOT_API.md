# Dream Physic AI Autopilot API

Base path: `/api/autopilot`. All endpoints require `Authorization: Bearer <JWT>` and return the existing wrapper `{ "success": true, "message": null, "data": ... }` (or a message string for successful mutations). IDs and all reads/writes are scoped to the authenticated email. Dates use ISO `YYYY-MM-DD`; all weights are kg.

## Daily plan, briefing, and live coach

| Method and path | Request JSON | `data` response |
|---|---|---|
| `GET /today` | none | `DailyPlan`: `{date, workout:{split,muscleGroups,exercises:[{name,sets,reps,weightKg,restSeconds,tempo,cues}],durationMinutes}, cardio:{activity,durationMinutes,distanceKm,paceMinPerKm,intensity}, nutrition:{calorieTarget,caloriesConsumed,caloriesRemaining,proteinTargetG,proteinConsumedG,proteinRemainingG,carbsG,fatG,fiberG,practicalMeals:[{name,foods,calories,proteinG,carbsG,fatG,fiberG}]}, recoveryStatus,recoveryReason,dailyGoals,tomorrowPreview,expressMode}`. Returns a generated safe baseline when no plan is saved.
| `POST /today/generate` | none | Same `DailyPlan`, persisted for today.
| `PUT /today` | `{workout,cardio,nutrition,recoveryStatus,dailyGoals,tomorrowPreview,expressMode}` | Saved `DailyPlan`.
| `GET /briefing` | none | `data` is a Gemini-generated daily briefing personalized with live athlete context and today's plan.
| `POST /coach` | `{prompt,exerciseName?,rpe?,pain?,missedWorkout?}` | `data` is the coach response. Pain asks it to stop the painful movement and discuss pain-free options; missed sessions are moved to an open slot without stacking sessions.
| `POST /missed-workout/reschedule` | `{missedDate,workoutName}` | `{missedDate,suggestedDate,workoutName,reason,doubleBooked:false,proposalId}`. Checks existing weekly slots, scheduled plans, and logged sessions. `POST /proposals/{proposalId}/decision` with `ACCEPT` rechecks the selected date and saves a single daily plan; if the slot is now occupied it rejects with a conflict message.

## Live workout

| Method and path | Request JSON | `data` response |
|---|---|---|
| `POST /live/start` | `{workoutName,firstExercise}` | `{workoutSessionId,exerciseName,exerciseIndex,restUntil,status}`.
| `POST /live/{id}/sets` | `{exerciseName,setNumber,reps,weightKg,previousWeightKg?,restSeconds}` | Existing workout `SetEntry` shape.
| `POST /live/{id}/rest` | `{restSeconds}` | Updated live session state including `restUntil`.
| `GET /live/{id}/next-set` | none | `{session:{workoutSessionId,exerciseName,exerciseIndex,restUntil,status},feedback}` based on previous logged sets.
| `POST /live/{id}/swap` | `{exerciseName,reason?}` | Updated live session state.
| `POST /voice-intent` | `{transcript}` | `{intent,exerciseName,restSeconds,feedback,transcript}`. Intents include `START_REST`, `NEXT_SET`, `END_SESSION`, `STOP_MOVEMENT`, and `COACH_QUERY`.

## Progressive overload

| Method and path | Request JSON | `data` response |
|---|---|---|
| `POST /overload/predict` | `{exerciseName,repFloor,repCeiling,availableIncrementKg?,rpe?,recoveryStatus,formClean?,pain?,targetWeightKg?,targetReps?,deadlineDate?}` | `{exerciseName,currentWeightKg,recentSessionReps,recommendedReps,recommendedWeightKg,reason,plateau,painReported,deadlineMissed,daysLate,deadlineDate,safeAlternative}`. Reps advance first. A weight increase requires two logged sessions at the rep ceiling, clean form, green readiness, manageable RPE, and the caller-supplied equipment increment. Pain stops progression.

## Physique goals and body transformation

| Method and path | Request JSON | `data` response |
|---|---|---|
| `GET /physique/goals` | none | Array of `{id,focus,goal,measurement,baseline,target,linkedExercises,nextSteps,active,createdAt}`.
| `POST /physique/goals` | `{focus,goal,measurement?,baseline?,target?,linkedExercises?,nextSteps?,active?}` | Saved goal view.
| `PUT /physique/goals/{id}` | Same as create | Updated goal view (owner only).
| `DELETE /physique/goals/{id}` | none | `data: null`.
| `POST /physique` | `{focus,goal,measurement?,baseline?,target?,nextSteps?}` | Gemini response with realistic steps; avoids spot-reduction claims.

## Recovery, backlog, proposals, and weekly review

| Method and path | Request JSON | `data` response |
|---|---|---|
| `GET /recovery` or `GET /recovery/backlog` | none | `{pendingGapKcal,plannedDailyDeficit,actualDeficit,originalDeadline,revisedDeadline,remainingDays,exerciseDebt:false}`.
| `POST /recovery` or `POST /recovery/evaluate` | `{sleepHours?,energyScore?,sorenessScore?,pain?,lowIntake?}` | `{readiness,reason,consumedCalories,estimatedTdee,actualDeficit,pendingGapKcal,optionalActivityKcal,originalDeadline,revisedDeadline,proposedDeadline,what,why,dataInfluenced,impactIfAccepted,proposalId}`. Unavailable TDEE/deficit are `null`. Deficit is mission maintenance/TDEE minus logged intake; logged exercise calories are not added. Optional activity is `0`, `50`, or `100` kcal.
| `POST /weekly-review` | none | `{from,to,summary,recommendations:[Proposal]}`. Generates a 7-day review and stores an actionable proposal.
| `GET /proposals` | none | Array of `{id,type,status,what,why,dataInfluenced,impactIfAccepted,details,createdAt}`.
| `POST /proposals/{id}/decision` | `{action:"ACCEPT"|"REJECT"|"EDIT",edits?:{...}}` | Updated `Proposal`. Accepting a recovery/backlog proposal applies its proposed deadline; accepting a missed-workout proposal schedules it after a fresh double-book check. Edit merges supplied fields into proposal details.

The default database remains in-memory H2 (`jdbc:h2:mem:dreamphysicdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL`). The `neon` profile's PostgreSQL JDBC URL, username, password, and driver settings are unchanged. Autopilot persistence tables are managed by the existing `spring.jpa.hibernate.ddl-auto=update` setting.
