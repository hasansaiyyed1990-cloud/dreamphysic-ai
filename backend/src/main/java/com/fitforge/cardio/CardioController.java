package com.fitforge.cardio;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/cardio") public class CardioController {
    private final CardioService service; private final com.fitforge.common.IdempotencyGuard idempotency;
    public CardioController(CardioService service, com.fitforge.common.IdempotencyGuard idempotency){this.service=service;this.idempotency=idempotency;}
    @GetMapping public ApiResponse<List<CardioDtos.Session>> list(Authentication a){return ApiResponse.ok(service.list(a.getName()));}
    @PostMapping public ApiResponse<CardioDtos.Session> create(Authentication a,@Valid @RequestBody CardioDtos.Create c){idempotency.check(a.getName(),"cardio-create",c);return ApiResponse.ok("Cardio session saved",service.create(a.getName(),c));}
    @DeleteMapping("/{id}") public ApiResponse<Void> delete(Authentication a,@PathVariable Long id){service.delete(a.getName(),id);return ApiResponse.ok("Cardio session deleted",null);}
    @GetMapping("/goals") public ApiResponse<List<CardioDtos.Goal>> goals(Authentication a){return ApiResponse.ok(service.goals(a.getName()));}
    @PutMapping("/goals") public ApiResponse<CardioDtos.Goal> goal(Authentication a,@Valid @RequestBody CardioDtos.GoalInput i){return ApiResponse.ok("Cardio goal saved",service.putGoal(a.getName(),i));}
}
