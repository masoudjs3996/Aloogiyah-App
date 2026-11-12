import { isAxiosError } from "axios";
export const isRateLimited = (error: unknown): boolean =>
  isAxiosError(error) && error.response?.status === 429;
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean =>
  !isRateLimited(error) && failureCount < 1;
