import Icon from "./Icon";

export default function EmptyState({ icon = "route", title, description, children }) {
  return (
    <div className="empty">
      <span className="empty__icon" aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="empty__title">{title}</h3>
      {description && <p className="empty__text">{description}</p>}
      {children && <div className="empty__actions">{children}</div>}
    </div>
  );
}
