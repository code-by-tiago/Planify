"use client";

import { type ReactNode } from "react";

export type PlanifyTabItem<T extends string = string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
};

type PlanifyTabsProps<T extends string = string> = {
  items: PlanifyTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  ariaLabel?: string;
};

export function PlanifyTabs<T extends string = string>({
  items,
  value,
  onChange,
  className = "",
  ariaLabel = "Abas",
}: PlanifyTabsProps<T>) {
  return (
    <div
      className={["pf-tabs flex gap-1 overflow-x-auto pb-0.5", className].filter(Boolean).join(" ")}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={["pf-tab", active ? "pf-tab--active" : ""].filter(Boolean).join(" ")}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge != null ? (
              <span className="pf-tab-badge">{item.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
