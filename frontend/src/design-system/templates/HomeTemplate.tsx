import { FC, ReactNode } from "react";
import { HomeBottomNavigation, HomeHeader } from "../organisms/Home";

interface HomeTemplateProps {
  children: ReactNode;
}

const HomeTemplate: FC<HomeTemplateProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-secondary-0">
      <HomeHeader />
      <main className="p-4  py-20">{children}</main>
      <HomeBottomNavigation />
    </div>
  );
};

export default HomeTemplate;
