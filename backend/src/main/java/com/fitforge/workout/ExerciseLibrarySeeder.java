package com.fitforge.workout;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Component @ConditionalOnProperty(name="fitforge.seed-library",havingValue="true",matchIfMissing=true) public class ExerciseLibrarySeeder implements CommandLineRunner {
    private final ExerciseLibraryRepository repository;
    public ExerciseLibrarySeeder(ExerciseLibraryRepository repository){this.repository=repository;}
    @Override @Transactional public void run(String... args){
        var items=List.of(
                guide("Barbell Back Squat","Legs","Barbell, rack","Set the bar across the upper back and stand shoulder-width.","Brace the trunk and keep the whole foot planted.","Sit between the hips, descend under control, then drive up through the floor.","Knees collapsing inward; heels lifting; losing a neutral trunk."),
                guide("Push-Up","Chest","Bodyweight","Hands just outside shoulder width; body in a straight line.","Brace glutes and abdomen; keep the neck neutral.","Lower chest between hands, then press to full elbow extension.","Hips sagging or piking; elbows flared straight out; partial range."),
                guide("Dumbbell Bench Press","Chest","Dumbbells, bench","Set shoulder blades against the bench with feet grounded.","Keep wrists stacked over elbows and brace before lowering.","Lower dumbbells beside the chest, then press upward without clanking.","Bouncing at the bottom; over-arching; wrists folding back."),
                guide("Romanian Deadlift","Hamstrings","Barbell or dumbbells","Stand tall with a soft bend in the knees.","Brace and keep the weight close to the legs.","Push hips back until hamstrings stretch, then drive hips forward.","Rounding the back; turning it into a squat; weight drifting forward."),
                guide("Lat Pulldown","Back","Cable machine","Sit tall and secure thighs under the pad.","Pull shoulders down before bending elbows.","Bring the bar toward upper chest, then return under control.","Leaning far back; pulling behind the neck; shrugging shoulders."),
                guide("Dumbbell Shoulder Press","Shoulders","Dumbbells","Sit or stand with weights at shoulder height.","Brace ribs down and keep wrists over elbows.","Press overhead in a smooth path, then lower to shoulders.","Overextending the lower back; pressing behind the head; uneven reps."),
                guide("Dumbbell Row","Back","Dumbbell, bench","Support one hand on a bench and keep the back flat.","Brace the trunk and let the working arm reach naturally.","Row elbow toward the hip, pause, then lower with control.","Twisting the torso; shrugging; using momentum."));
        items.stream().filter(i->!repository.existsByNameIgnoreCase(i.name())).map(ExerciseLibraryItem::new).forEach(repository::save);
    }
    private WorkoutDtos.ExerciseGuideInput guide(String n,String m,String e,String setup,String brace,String execution,String mistakes){return new WorkoutDtos.ExerciseGuideInput(n,m,e,setup,brace,execution,mistakes);}
}
