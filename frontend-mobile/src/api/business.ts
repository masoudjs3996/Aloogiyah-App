import http from "./http";
import { request } from "./platform";
import type { Page } from "../shared/types/platform";
import type { BusinessApplication } from "../shared/types/business";
import type { TermsEnvelope } from "../shared/types/legal";
export const businessApi = {
  terms: () => request<TermsEnvelope>("/Legal/Terms"),
  mine: () =>
    request<Page<BusinessApplication>>("/BusinessApplication/My", {
      params: { pageSize: 100 },
    }),
  submit: (data: FormData, code?: string) =>
    request<BusinessApplication>(
      code
        ? `/BusinessApplication/${encodeURIComponent(code)}/Resubmit`
        : "/BusinessApplication",
      { method: "POST", data, timeout: 120000 },
    ),
  download: async (code: string, doc: string) =>
    (
      await http.get<ArrayBuffer>(
        `/BusinessApplication/${encodeURIComponent(code)}/Documents/${encodeURIComponent(doc)}`,
        { responseType: "arraybuffer" },
      )
    ).data,
};
