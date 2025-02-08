import { Stores } from "@/types/store";
import { createSlice } from "@reduxjs/toolkit";

const storesSlice = createSlice({
  name: "stores",
  initialState: {
    data: [] as Stores,
  },
  reducers: {
    clearStores: (state) => {
      state.data = [];
    },
    addStores: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { clearStores, addStores } = storesSlice.actions;
export default storesSlice.reducer;
