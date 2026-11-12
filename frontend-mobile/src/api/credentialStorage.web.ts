// The optional browser preview is intentionally ephemeral. Native builds use SecureStore.
const memory = new Map<string, string>();
export const getItemAsync = async (key: string) => memory.get(key) || null;
export const setItemAsync = async (key: string, value: string) => {
  memory.set(key, value);
};
export const deleteItemAsync = async (key: string) => {
  memory.delete(key);
};
