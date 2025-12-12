import { editUserInfo, uploadProfileImage } from "@/lib/actions/profile";
import { useMutation } from "@tanstack/react-query";
export const useUpdateProfile = () => {
  const editUser = useMutation({
    mutationFn: editUserInfo,
  });
  const uploadImage = useMutation({
    mutationFn: uploadProfileImage,
  });
  return { editUser, uploadImage };
};

export default useUpdateProfile;
