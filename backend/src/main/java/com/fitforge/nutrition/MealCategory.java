package com.fitforge.nutrition;

import jakarta.persistence.*;

/** User-defined meal slot (Breakfast, Office Snacks, ...), orderable and timed. */
@Entity
@Table(name = "meal_categories", uniqueConstraints = @UniqueConstraint(name = "uk_meal_category_user_name", columnNames = {"user_id", "name"}))
public class MealCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(nullable = false, length = 60) private String name;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    @Column(name = "time_label", length = 20) private String timeLabel;
    @Column(name = "is_default", nullable = false) private boolean isDefault;

    protected MealCategory() {}

    public MealCategory(Long userId, String name, int sortOrder, String timeLabel, boolean isDefault) {
        this.userId = userId;
        this.name = name;
        this.sortOrder = sortOrder;
        this.timeLabel = timeLabel;
        this.isDefault = isDefault;
    }

    public void update(String name, Integer order, String timeLabel) {
        if (name != null && !name.isBlank()) this.name = name.trim();
        if (order != null) this.sortOrder = order;
        if (timeLabel != null) this.timeLabel = timeLabel.isBlank() ? null : timeLabel.trim();
    }

    public void moveTo(int order) { this.sortOrder = order; }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getName() { return name; }
    public int getSortOrder() { return sortOrder; }
    public String getTimeLabel() { return timeLabel; }
    public boolean isDefault() { return isDefault; }
}
