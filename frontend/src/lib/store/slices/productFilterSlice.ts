import { createSlice } from "@reduxjs/toolkit";

interface ProductFilterState {
  search: string;
  categories: string;
}

const initialState: ProductFilterState = {
  search: "",
  categories: "",
};
const productFilterSlice = createSlice({
  name: "productFilterSlice",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
  },
});
export const { setSearch, setCategories } = productFilterSlice.actions;

export default productFilterSlice.reducer;
