import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import productFilterSlice from "./slices/productFilterSlice";
export const makeStore = () => {
  return configureStore({
    reducer: {
      user: userReducer,
      productFilter: productFilterSlice,
    },
  });
};
