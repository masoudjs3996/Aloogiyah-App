type CheckboxProps = {
  checked: boolean;
};

const Checkbox = ({ checked }: CheckboxProps) => {
  return <input type="checkbox" checked={checked} readOnly />;
};

export default Checkbox;
