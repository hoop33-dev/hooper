import type { SequenceExerciseLibrary } from "@/src/components/portal/sequences/SequenceStepPicker";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { listUnitTypes } from "@/src/services/unitType.service";
import type { UnitTypeRow } from "@hooper/db";

/** What every sequence editor needs: the exercises steps pick from, the
 * categories steps narrow by, and the units a sequence can track. */
export async function loadSequenceEditorData(): Promise<{
  library: SequenceExerciseLibrary;
  unitTypes: UnitTypeRow[];
}> {
  const [exercises, categories, unitTypes] = await Promise.all([
    listExercises(),
    listCategories(),
    listUnitTypes(),
  ]);
  return {
    library: {
      exercises: exercises.ok ? exercises.data : [],
      categories: categories.ok ? categories.data : [],
    },
    unitTypes: unitTypes.ok ? unitTypes.data : [],
  };
}
