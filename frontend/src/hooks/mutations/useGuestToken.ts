import { getGuestToken } from "@/lib/actions/user";
import { useMutation } from "@tanstack/react-query";

const useGuestToken = () => {
  const mutation = useMutation({
    mutationFn: getGuestToken,
  });

  return mutation;
};

export default useGuestToken;
