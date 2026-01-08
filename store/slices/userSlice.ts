import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  userId: string | null;
  isInitialized: boolean;
}

const initialState: UserState = {
  userId: null,
  isInitialized: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserId(state, action: PayloadAction<string>) {
      state.userId = action.payload;
      state.isInitialized = true;
    },
  },
});

export const { setUserId } = userSlice.actions;
export default userSlice.reducer;
