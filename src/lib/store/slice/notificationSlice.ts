import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    show: false,
    message: "",
    type: NOTIFICATION_TYPES.INFO,
    duration: 3000,
  },
  reducers: {
    showNotification: (state, action) => {
      state.show = true;
      state.message = action.payload.message;
      state.type = action.payload.type || NOTIFICATION_TYPES.INFO;
      state.duration = action.payload.duration || 3000;
    },
    hideNotification: (state) => {
      state.show = false;
    },
  },
});

export const { showNotification, hideNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
