import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  showFocusOverlay: boolean;
  showInterruptionWarning: boolean;
}

const initialState: UIState = {
  showFocusOverlay: false,
  showInterruptionWarning: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setFocusOverlay(state, action: PayloadAction<boolean>) {
      state.showFocusOverlay = action.payload;
    },
  },
});

export const { setFocusOverlay } = uiSlice.actions;
export default uiSlice.reducer;
