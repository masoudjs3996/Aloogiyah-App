import { CreateFarm } from "@/lib/actions/farm";
import { useMutation } from "@tanstack/react-query";
export const useCreateFarm = () => {
  const createFarm = useMutation({
    mutationFn: CreateFarm,
  });

  return { createFarm };
};

export default useCreateFarm;
