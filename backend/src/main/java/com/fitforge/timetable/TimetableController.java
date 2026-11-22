package com.fitforge.timetable;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/api/timetable")
public class TimetableController {
    private final TimetableService service; public TimetableController(TimetableService service){this.service=service;}
    @GetMapping("/weekly") public ApiResponse<List<TimetableDtos.PlanDay>> weekly(Authentication a){return ApiResponse.ok(service.weekly(a.getName()));}
    @PutMapping("/weekly/{day}") public ApiResponse<TimetableDtos.PlanDay> plan(Authentication a,@PathVariable String day,@Valid @RequestBody TimetableDtos.PlanUpdate u){return ApiResponse.ok(service.savePlan(a.getName(),parseDay(day),u));}
    @PatchMapping("/weekly/{day}/express") public ApiResponse<TimetableDtos.PlanDay> express(Authentication a,@PathVariable String day,@RequestBody TimetableDtos.Toggle t){return ApiResponse.ok(service.express(a.getName(),parseDay(day),t.enabled()));}
    @GetMapping("/daily/{date}") public ApiResponse<TimetableDtos.DailyCheckIn> daily(Authentication a,@PathVariable LocalDate date){return ApiResponse.ok(service.daily(a.getName(),date));}
    @PatchMapping("/daily/{date}/creatine") public ApiResponse<TimetableDtos.DailyCheckIn> creatine(Authentication a,@PathVariable LocalDate date,@RequestBody TimetableDtos.Toggle t){return ApiResponse.ok(service.toggle(a.getName(),date,"creatine",t.enabled()));}
    @PatchMapping("/daily/{date}/water") public ApiResponse<TimetableDtos.DailyCheckIn> waterToggle(Authentication a,@PathVariable LocalDate date,@RequestBody TimetableDtos.Toggle t){return ApiResponse.ok(service.toggle(a.getName(),date,"water",t.enabled()));}
    @PutMapping("/daily/{date}/water-glasses") public ApiResponse<TimetableDtos.DailyCheckIn> waterGlasses(Authentication a,@PathVariable LocalDate date,@Valid @RequestBody TimetableDtos.WaterUpdate u){return ApiResponse.ok(service.water(a.getName(),date,u.glasses()));}
    @PatchMapping("/daily/{date}/complete") public ApiResponse<TimetableDtos.DailyCheckIn> complete(Authentication a,@PathVariable LocalDate date,@RequestBody TimetableDtos.Toggle t){return ApiResponse.ok(service.toggle(a.getName(),date,"complete",t.enabled()));}
    @GetMapping("/heatmap") public ApiResponse<List<TimetableDtos.DailyCheckIn>> heatmap(Authentication a,@RequestParam LocalDate from,@RequestParam LocalDate to){return ApiResponse.ok(service.heatmap(a.getName(),from,to));}
    @GetMapping("/streak") public ApiResponse<TimetableDtos.Streak> streak(Authentication a){return ApiResponse.ok(service.streak(a.getName()));}
    private DayOfWeek parseDay(String value){String d=value.trim().toLowerCase(java.util.Locale.ROOT);return switch(d){case "mon","monday"->DayOfWeek.MONDAY;case "tue","tues","tuesday"->DayOfWeek.TUESDAY;case "wed","wednesday"->DayOfWeek.WEDNESDAY;case "thu","thur","thurs","thursday"->DayOfWeek.THURSDAY;case "fri","friday"->DayOfWeek.FRIDAY;case "sat","saturday"->DayOfWeek.SATURDAY;case "sun","sunday"->DayOfWeek.SUNDAY;default->throw new IllegalArgumentException("day must be Mon-Sun");};}
}
