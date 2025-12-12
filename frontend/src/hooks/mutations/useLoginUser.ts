import { LoginUser } from "@/lib/actions/auth";
import { useMutation } from "@tanstack/react-query";
export const useLoginUser = () => {
  const loginuser = useMutation({
    mutationFn: (data: any) => {
      console.log("📨 داده ارسالی به API:", data);
      return LoginUser(data);
    },
  });
  return { loginuser };
};

export default useLoginUser;
