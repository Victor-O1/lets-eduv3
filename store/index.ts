import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import subjectsReducer from "./slices/subjectsSlice";
import focusReducer from "./slices/focusSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    subjects: subjectsReducer,
    focus: focusReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
