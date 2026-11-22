package com.fitforge.cardio;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/cardio") public class CardioController {
    private final CardioService service; public CardioController(CardioService service){this.service=service;}
    @GetMapping public ApiResponse<List<CardioDtos.Session>> list(Authentication a){return ApiResponse.ok(service.list(a.getName()));}
    @PostMapping public ApiResponse<CardioDtos.Session> create(Authentication a,@Valid @RequestBody CardioDtos.Create c){return ApiResponse.ok("Cardio session saved",service.create(a.getName(),c));}
    @DeleteMapping("/{id}") public ApiResponse<Void> delete(Authentication a,@PathVariable Long id){service.delete(a.getName(),id);return ApiResponse.ok("Cardio session deleted",null);}
}
