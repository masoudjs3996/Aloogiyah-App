import { FiBell } from "react-icons/fi";

const Notification = ({ text }: { text: string }) => {
  return (
    <div className="flex items-center gap-3 py-3 border-b text-xs">
      <FiBell />
      <span>{text}</span>
    </div>
  );
};
export default Notification