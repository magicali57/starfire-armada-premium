import "./NotificationBadge.css";

interface NotificationBadgeProps {
  count: number;
  max?: number;
}

export function NotificationBadge({ count, max = 99 }: NotificationBadgeProps) {
  if (count <= 0) return null;
  const display = count > max ? `${max}+` : String(count);
  return (
    <span className="notification-badge" aria-label={`${count} notifications`}>
      {display}
    </span>
  );
}
