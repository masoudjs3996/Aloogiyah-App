import { RegisterUser } from "@/lib/actions/auth";
import { useMutation } from "@tanstack/react-query";
export const useRegisterUser = () => {
  const registeruser = useMutation({
    mutationFn: (data: any) => {
      return RegisterUser(data);
    },
  });
  return { registeruser };
};

export default useRegisterUser;
