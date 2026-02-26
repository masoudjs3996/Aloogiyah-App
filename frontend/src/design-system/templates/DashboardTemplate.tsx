"use client";
import { ReactNode } from "react";
import { Sidebar } from "../organisms/dashbord/Sidebar";
import Notification from "../molecules/dashbord/NotificationItem";

interface DashboardTemplateProps {
  children: ReactNode;
}

const DashboardTemplate = ({ children }: DashboardTemplateProps) => {
  return (
    <div className="flex h-screen  justify-end">
      <Sidebar role={"admin"} />
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      {/* <aside className="w-36 bg-white border-l p-6 hidden lg:block">
        <h3 className="text-lg font-semibold mb-4">Notifications</h3>
        <Notification text="New message" />
        <Notification text="Server updated" />
      </aside> */}
    </div>
  );
};
export default DashboardTemplate;

// ---------- Components ----------

// import { TextField } from "../molecules/public";
// import { DashboardBottomNavigation } from "../organisms/dashbord";
// import { ProfileHeader } from "../organisms/dashbord/ProfileHeader";

// interface DashboardTemolateProps {
//   children: React.ReactNode;
// }

// const DashboardTemolate = ({ children }: DashboardTemolateProps) => {
//   return (
//     <>
//       <div className="fixed top-0 w-full z-10">
//         <ProfileHeader />
//       </div>
//       <main className="p-4 mt-10 pb-20">{children}</main>
//       <DashboardBottomNavigation />
//     </>
//   );
// };

// export default DashboardTemolate;
