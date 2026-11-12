import { API_BASE } from "./config";
import { session } from "./session";
import { createAuthClient } from "./authClient";
const client = createAuthClient(API_BASE, session);
export const guestToken = client.guestToken;
export const refreshToken = client.refreshToken;
export default client.http;
