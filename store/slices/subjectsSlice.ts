import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Subject } from "@/lib/types";

interface SubjectsState {
  list: Subject[];
  selectedSubjectId: string | null;
  status: "idle" | "loading" | "error";
}

const initialState: SubjectsState = {
  list: [],
  selectedSubjectId: null,
  status: "idle",
};

const subjectsSlice = createSlice({
  name: "subjects",
  initialState,
  reducers: {
    setSubjects(state, action: PayloadAction<Subject[]>) {
      state.list = action.payload;
    },
    selectSubject(state, action: PayloadAction<string | null>) {
      state.selectedSubjectId = action.payload;
    },
  },
});

export const { setSubjects, selectSubject } = subjectsSlice.actions;
export default subjectsSlice.reducer;
