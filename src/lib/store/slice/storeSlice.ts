import { Store } from "@/types/store";
import { createSlice } from "@reduxjs/toolkit";

const storeSlice = createSlice({
  name: "store",
  initialState: {
    data: null as Store | null,
  },
  reducers: {
    clearStore: (state) => {
      state.data = null;
    },
    addStore: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { clearStore, addStore } = storeSlice.actions;
export default storeSlice.reducer;
