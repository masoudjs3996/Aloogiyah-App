import { editUserInfo, uploadProfileImage } from "@/lib/actions/profile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
export default function useUpdateProfile() {
 const client = useQueryClient();
 const updated = async () => { await Promise.all([client.invalidateQueries({ queryKey: ["platform", "profile"] }), client.invalidateQueries({ queryKey: ["userProfile"] })]); };
 const editUser = useMutation({ mutationFn: editUserInfo, onSuccess: updated });
 const uploadImage = useMutation({ mutationFn: uploadProfileImage, onSuccess: updated });
 return { editUser, uploadImage };
}
export { useUpdateProfile };
