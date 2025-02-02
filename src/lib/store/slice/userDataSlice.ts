import { activeUser } from "@/types/user";
import { createSlice } from "@reduxjs/toolkit";

interface UserState {
  data: activeUser | null;
  loading: boolean;
  error: string | null;
}

const userDataSlice = createSlice({
  name: "user",
  initialState: {
    data: null,
    loading: false,
    error: null,
  } as UserState,
  reducers: {
    clearUser: (state) => {
      state.data = null;
      state.error = null;
    },
    addUser: (state, action) => {
      state.data = action.payload;
      state.error = null;
    },
  },
});

export const { clearUser, addUser } = userDataSlice.actions;
export default userDataSlice.reducer;
