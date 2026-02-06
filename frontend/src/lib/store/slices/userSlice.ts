import { createSlice } from "@reduxjs/toolkit";
const userSlice = createSlice({
  name: "user",
  initialState: { data: null, isAuthenticated: false },
  reducers: {
    setUser: (state, action) => {
      state.data = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.data = null;
      state.isAuthenticated = false;
    },
  },
});
export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
