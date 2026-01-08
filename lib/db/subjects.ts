import { supabase } from "@/lib/supabase";
import { Subject } from "@/lib/types";

export async function fetchSubjectsFromDB() {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch subjects:", error);
    throw error;
  }

  return data as Subject[];
}

export async function insertSubject(subject: Subject) {
  const { error } = await supabase.from("subjects").insert(subject);

  if (error) {
    console.error("Failed to insert subject:", error);
    throw error;
  }
}

export async function deleteSubjectById(subjectId: string) {
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", subjectId);

  if (error) {
    console.error("Failed to delete subject:", error);
    throw error;
  }
}

export async function updateSubjectInDB(
  subjectId: string,
  updates: {
    name: string;
    color: string;
  }
) {
  const { error } = await supabase
    .from("subjects")
    .update({
      name: updates.name,
      color: updates.color,
    })
    .eq("id", subjectId);

  if (error) {
    console.error("Failed to update subject:", error);
    throw error;
  }
}
