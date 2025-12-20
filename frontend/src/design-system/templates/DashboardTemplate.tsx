import { TextField } from "../molecules/public";
import { DashboardBottomNavigation } from "../organisms/dashbord";
import { ProfileHeader } from "../organisms/dashbord/ProfileHeader";

interface DashboardTemolateProps {
  children: React.ReactNode;
}

const DashboardTemolate = ({ children }: DashboardTemolateProps) => {
  return (
    <>
      <div className="fixed top-0 w-full z-10">
        <ProfileHeader />
      </div>
      <main className="p-4 mt-10 pb-20">{children}</main>
      <DashboardBottomNavigation />
    </>
  );
};

export default DashboardTemolate;
