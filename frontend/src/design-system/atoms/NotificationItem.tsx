interface Props {
  title: string;
  description: string;
}

const NotificationItem = ({ title, description }: Props) => {
  return (
    <div className="border-b last:border-none py-2">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted_foreground">{description}</p>
    </div>
  );
};

export default NotificationItem;
