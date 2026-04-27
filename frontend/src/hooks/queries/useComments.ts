import { getCommentsTree } from "@/lib/actions/comments";
import { useQuery } from "@tanstack/react-query";

export const useCommentsTree = () => {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["getCommentsTree"],
    queryFn: async () => await getCommentsTree(),
    staleTime: 1000 * 60 * 2,
  });
  return {
    data,
    isError,
    isLoading,
  };
};
