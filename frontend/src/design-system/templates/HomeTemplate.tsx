
import { FC, ReactNode } from "react";
import { HomeBottomNavigation, HomeHeader } from "../organisms/Home";

interface HomeTemplateProps {
  children: ReactNode;
}

const HomeTemplate: FC<HomeTemplateProps> = ({ children }) => {
 
  return (
    <div className="min-h-screen bg-secondary-0 ">
      <HomeHeader />
<<<<<<< HEAD
      <main className="pb-10">{children}</main>
=======
      <main >{children}</main>
>>>>>>> 35a56bf7508fb1ac82778fe55f43c6436f5ae3e7
      <HomeBottomNavigation />
    </div>
  );
};

export default HomeTemplate;
