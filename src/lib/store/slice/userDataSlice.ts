import { activeUser } from "@/types/user";
import { createSlice } from "@reduxjs/toolkit";

type userData = {
  data: {
    user: activeUser;
  };
};

const userDataSlice = createSlice({
  name: "user",
  initialState: {
    data: null as any,
    loading: false as boolean,
    error: null as string | null,
  },
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
