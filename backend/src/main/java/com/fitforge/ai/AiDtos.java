package com.fitforge.ai;

import jakarta.validation.constraints.NotBlank;

public final class AiDtos {
    private AiDtos(){}
    public record MealScanRequest(@NotBlank String imageBase64,String mimeType,String prompt){}
    public record PromptRequest(@NotBlank String prompt){}
    public record MealAnalysis(String name,int calories,double proteinG,double carbsG,double fatG,Double fiberG,String description){}
}
