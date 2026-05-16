import type { ReactNode } from "react";

type SettingsSectionProps = {
  title?: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export function SettingsSection({
  title,
  icon,
  description,
  actions,
  className = "",
  bodyClassName = "",
  children,
}: SettingsSectionProps) {
  return (
    <div className={`admin-panel admin-shell-card p-5 ${className}`.trim()}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              {icon}
              {title}
            </div>
            {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={title ? `mt-4 ${bodyClassName}`.trim() : bodyClassName}>{children}</div>
    </div>
  );
}
