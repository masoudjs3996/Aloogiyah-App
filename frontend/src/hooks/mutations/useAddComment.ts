import { CreateCommentPayload, postComment } from "@/lib/actions/comments";
import { useMutation } from "@tanstack/react-query";

export const useCreateComment = () => {
  const createComment = useMutation({
    mutationFn: (payload: CreateCommentPayload) => postComment(payload),
  });

  return { createComment };
};
