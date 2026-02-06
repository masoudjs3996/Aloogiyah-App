import { CreateFarm } from "@/lib/actions/farm";
import { useMutation } from "@tanstack/react-query";
export const useCreateFarm = () => {
  const createFarm = useMutation({
    mutationFn: (formData: FormData) => CreateFarm(formData),
  });

  return { createFarm };
};

export default useCreateFarm;
