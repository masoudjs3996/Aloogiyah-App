import axiosInstance from "@/shared/lib/config/axions";
import { number } from "yup";

export async function getCommentsTree() {
  try {
    const { data } = await axiosInstance.get("/Comment/GetTreeComments");

    return data.data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    throw error;
  }
}

export type CreateCommentPayload = {
  content: string;
  rating?: number;
  entityCode: string;
  parentCode?: string;
  entityComment: "AgriculturalProduct" | string | number;
};
export async function postComment(payload: CreateCommentPayload) {
  try {
    const body = {
      content: payload.content,
      rating: payload.parentCode ? undefined : payload.rating,
      entityCode: payload.entityCode,
      entityComment: payload.entityComment,
    };
    const { data } = payload.parentCode
      ? await axiosInstance.post("/Comment/Reply", body, { params: { parentCode: payload.parentCode } })
      : await axiosInstance.post("/Comment/Create", body);

    return data.data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    throw error;
  }
}
