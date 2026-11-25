package com.fitforge.auth;

import com.fitforge.cardio.CardioAiQuota;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AccountDeletionService {
    private static final List<String> EMAIL_SCOPED_ENTITIES = List.of(
            "WorkoutSet", "WorkoutSession", "PushUpLog", "ExerciseGoal",
            "CardioSession", "CardioGoal", "CardioCustomExercise",
            "MealEntry", "FavoriteMeal",
            "WeightEntry", "PhysiqueCheckIn",
            "AutopilotDay", "AutopilotSettings", "CoachProposal", "LiveWorkoutState", "PhysiqueGoal",
            "DailyCheckIn", "WeeklyPlanDay"
    );

    private static final List<String> USER_ID_SCOPED_ENTITIES = List.of(
            "FoodDiaryEntry", "IndianFoodItem", "FatLossMission", "DailyCalorieBalance",
            "DeadlineChange", "HydrationFiberLog", "GroceryList", "NutritionReminderPref"
    );

    private final EntityManager em;
    private final AppUserRepository users;
    private final CardioAiQuota quota;

    public AccountDeletionService(EntityManager em, AppUserRepository users, CardioAiQuota quota) {
        this.em = em;
        this.users = users;
        this.quota = quota;
    }

    @Transactional
    public void deleteAccount(String email) {
        String normalized = email.trim().toLowerCase();
        AppUser user = users.findByEmail(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Long userId = user.getId();

        for (String entity : EMAIL_SCOPED_ENTITIES) {
            em.createQuery("DELETE FROM " + entity + " e WHERE e.userEmail = :email")
                    .setParameter("email", normalized)
                    .executeUpdate();
        }
        em.createQuery("DELETE FROM PasswordResetOtp e WHERE e.email = :email")
                .setParameter("email", normalized)
                .executeUpdate();
        for (String entity : USER_ID_SCOPED_ENTITIES) {
            em.createQuery("DELETE FROM " + entity + " e WHERE e.userId = :uid")
                    .setParameter("uid", userId)
                    .executeUpdate();
        }
        quota.clearUser(normalized);
        users.delete(user);
    }
}
