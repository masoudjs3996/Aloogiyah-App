import Checkbox from "@/design-system/atoms/Checkbox ";

type MultiSelectItemProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
};

const MultiSelectItem = ({
  label,
  selected,
  onToggle,
}: MultiSelectItemProps) => {
  return (
    <div
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary-50"
    >
      <Checkbox checked={selected} />
      <span className="text-sm">{label}</span>
    </div>
  );
};

export default MultiSelectItem;
