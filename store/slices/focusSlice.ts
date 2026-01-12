import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ActiveSession {
  sessionId: string;
  subjectId: string;
  startTime: string;
  description?: string;
}

// interface FocusState {
//   status: "idle" | "running" | "paused";
//   activeSession: ActiveSession | null;
//   elapsedSeconds: number;
//   isInterrupted: boolean;
// }
interface FocusState {
  status: "idle" | "running";
  activeSession: ActiveSession | null;

  elapsedSeconds: number; // live ticking
  accumulatedSeconds: number; // ⬅ NEW (persists across pauses)

  lastSubjectId: string | null;
}

// const initialState: FocusState = {
//   status: "idle",
//   activeSession: null,
//   elapsedSeconds: 0,
//   isInterrupted: false,
// };
const initialState: FocusState = {
  status: "idle",
  activeSession: null,
  elapsedSeconds: 0,
  accumulatedSeconds: 0,
  lastSubjectId: null,
};

const focusSlice = createSlice({
  name: "focus",
  initialState,
  reducers: {
    startFocus(state, action) {
      state.status = "running";
      state.activeSession = action.payload;
      state.lastSubjectId = action.payload.subjectId;
      state.elapsedSeconds = 0;
    },

    endSegment(state) {
      state.accumulatedSeconds += state.elapsedSeconds;
      state.elapsedSeconds = 0;
      state.status = "idle";
      state.activeSession = null;
    },

    stopFocus(state) {
      state.status = "idle";
      state.activeSession = null;
      state.elapsedSeconds = 0;
      state.accumulatedSeconds = 0;
    },

    // startFocus(state, action: PayloadAction<ActiveSession>) {
    //   state.activeSession = action.payload;
    //   state.status = "running";
    //   state.elapsedSeconds = 0;
    //   // state.isInterrupted = false;
    //   state.elapsedSeconds = 0; // new segment
    // },
    tick(state) {
      if (state.status === "running") {
        state.elapsedSeconds += 1;
      }
    },
    // endSegment(state) {
    //   state.accumulatedSeconds += state.elapsedSeconds;
    //   state.elapsedSeconds = 0;
    //   state.status = "idle";
    //   state.activeSession = null;
    // },
    // stopFocus(state) {
    //   state.status = "idle";
    //   state.activeSession = null;
    //   state.elapsedSeconds = 0;
    //   state.isInterrupted = false;
    // },
    // stopFocus(state) {
    //   state.status = "idle";
    //   state.activeSession = null;
    //   state.elapsedSeconds = 0;
    //   state.accumulatedSeconds = 0;
    //   // lastSubjectId can stay
    // },

    // markInterrupted(state) {
    //   state.isInterrupted = true;
    // }
    // pause(state) {
    //   if (state.status === "running") {
    //     state.status = "paused";
    //   }
    // },
    // resume(state) {
    //   if (state.status === "paused") {
    //     state.status = "running";
    //   }
    // },
    setElapsed(state, action: PayloadAction<number>) {
      state.elapsedSeconds = action.payload;
    },
    // ✅ ADD THESE TWO
    setAccumulated(state, action: PayloadAction<number>) {
      state.accumulatedSeconds = action.payload;
    },

    setLastSubject(state, action: PayloadAction<string | null>) {
      state.lastSubjectId = action.payload;
    },
  },
});

export const {
  startFocus,
  tick,
  stopFocus,
  endSegment,
  // markInterrupted,
  // pause,
  // resume,
  setElapsed,
  setAccumulated,
  setLastSubject,
} = focusSlice.actions;
export default focusSlice.reducer;
