import { SmallText, Title } from "@/design-system/atoms/Typography";

export const MenuItem = ({ icon: Icon, title, subtitle }: any) => (
  <div className="bg-secondary-0 rounded-lg shadow-sm p-2 flex items-center space-x-4 space-x-reverse">
    <div className="p-1">
      <Icon className="w-6 h-6 text-secondary-700" /> 
    </div>
    <div className="flex-1">
      <Title>{title}</Title>
      <SmallText>{subtitle}</SmallText>
    </div>
  </div>
);
