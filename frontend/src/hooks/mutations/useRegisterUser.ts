import { RegisterUser } from "@/lib/actions/auth";
import { useMutation } from "@tanstack/react-query";
export const useRegisterUser = () => {
  const registeruser = useMutation({
    mutationFn: (data: any) => {
      console.log("📨 داده ارسالی به API:", data);
      return RegisterUser(data);
    },
  });
  return { registeruser };
};

export default useRegisterUser;
