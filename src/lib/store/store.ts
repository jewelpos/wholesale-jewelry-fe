import { configureStore } from "@reduxjs/toolkit";
import notificationSlice from "./slice/notificationSlice";
import userDataSlice from "./slice/userDataSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      notification: notificationSlice,
      user: userDataSlice,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
