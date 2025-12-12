export interface IApiResponse<T = undefined> {
  isSuccess: boolean;
  message: string;
  data?: T | null;
}

export interface IAuthData {
  token: string;
  refreshToken: string;
  expires: string;
}
export type PageParams<T extends string> = {
  params: Promise<Record<T, string>>;
};