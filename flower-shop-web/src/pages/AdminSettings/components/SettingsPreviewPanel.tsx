import type { ReactNode } from "react";

type SettingsPreviewPanelProps = {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function SettingsPreviewPanel({
  title,
  description,
  className = "",
  children,
}: SettingsPreviewPanelProps) {
  return (
    <div className={`admin-panel admin-shell-card p-5 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}
