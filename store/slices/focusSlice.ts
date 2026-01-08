import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ActiveSession {
  sessionId: string;
  subjectId: string;
  startTime: string;
  description?: string;
}

interface FocusState {
  status: "idle" | "running" | "paused";
  activeSession: ActiveSession | null;
  elapsedSeconds: number;
  isInterrupted: boolean;
}

const initialState: FocusState = {
  status: "idle",
  activeSession: null,
  elapsedSeconds: 0,
  isInterrupted: false,
};

const focusSlice = createSlice({
  name: "focus",
  initialState,
  reducers: {
    startFocus(state, action: PayloadAction<ActiveSession>) {
      state.activeSession = action.payload;
      state.status = "running";
      state.elapsedSeconds = 0;
      state.isInterrupted = false;
    },
    tick(state) {
      if (state.status === "running") {
        state.elapsedSeconds += 1;
      }
    },
    stopFocus(state) {
      state.status = "idle";
      state.activeSession = null;
      state.elapsedSeconds = 0;
      state.isInterrupted = false;
    },
    markInterrupted(state) {
      state.isInterrupted = true;
    },
    pause(state) {
      if (state.status === "running") {
        state.status = "paused";
      }
    },
    resume(state) {
      if (state.status === "paused") {
        state.status = "running";
      }
    },
    setElapsed(state, action: PayloadAction<number>) {
      state.elapsedSeconds = action.payload;
    },
  },
});

export const {
  startFocus,
  tick,
  stopFocus,
  markInterrupted,
  pause,
  resume,
  setElapsed,
} = focusSlice.actions;
export default focusSlice.reducer;
