"use client";
import { EditProfileForm } from "@/design-system/organisms/dashbord/EditProfileForm";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import QueryState from "@/design-system/molecules/platform/QueryState";
export default function Page() { const profile = usePlatformProfile(); return <div className="mx-auto max-w-md pt-6"><QueryState loading={profile.isLoading} error={profile.error} retry={() => profile.refetch()} skeleton="form"><EditProfileForm file={null} user={profile.data?.user} /></QueryState></div>; }
