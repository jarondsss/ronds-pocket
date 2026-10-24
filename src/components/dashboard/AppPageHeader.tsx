import { BackToHome } from "@/components/BackToHome";
import type { ReactNode } from "react";

export function AppPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3">
      <BackToHome />
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
          {title}
        </h1>
        <div className="truncate text-xs text-muted-foreground sm:text-sm">
          {subtitle}
        </div>
      </div>
      {action}
    </header>
  );
}

export function AppSummaryCard({
  label,
  value,
  detail,
  children,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] bg-card p-5 shadow-[0_14px_30px_-24px_var(--clay-dark)] sm:p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 font-display text-[2rem] font-extrabold leading-tight tracking-tight sm:text-4xl">
        {value}
      </div>
      {detail && (
        <div className="mt-3 text-xs text-muted-foreground sm:text-sm">
          {detail}
        </div>
      )}
      {children}
    </section>
  );
}
