import { createSlice } from "@reduxjs/toolkit";

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    layoutstyledata: localStorage.getItem("layoutStyling") || "default",
  },
  reducers: {
    setLayoutChange: (state, action) => {
      state.layoutstyledata = action.payload;
    },
  },
});

export const { setLayoutChange } = themeSlice.actions;
export default themeSlice.reducer;
