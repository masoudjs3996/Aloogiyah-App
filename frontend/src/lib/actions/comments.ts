import axiosInstance from "@/shared/lib/config/axions";
import { number } from "yup";

export async function getCommentsTree() {
  try {
    const { data } = await axiosInstance.get("/Comment/GetTreeComments");

    return data.data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return null;
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
    const { data } = await axiosInstance.post("/Comment/Create", {
      content: payload.content,
      rating: payload.rating,
      entityCode: payload.entityCode,
      parentCode: payload.parentCode || "",
      entityComment: payload.entityComment,
    });

    return data.data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return null;
  }
}
