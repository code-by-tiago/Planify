import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import { GoogleDriveIcon } from "@/components/google/GoogleDriveIcon";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { TRUST_ITEMS } from "./constants";

const GOOGLE_PRODUCT_ICONS = {
  drive: GoogleDriveIcon,
  classroom: GoogleClassroomIcon,
} as const;

export function LandingTrustBar() {
  return (
    <section className="border-y border-slate-200/80 bg-white/80 px-5 py-6 sm:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {TRUST_ITEMS.map((item) => {
          const googleProduct =
            "googleProduct" in item ? item.googleProduct : undefined;
          const GoogleIcon = googleProduct
            ? GOOGLE_PRODUCT_ICONS[googleProduct]
            : null;
          const planifyIcon =
            "icon" in item ? (item.icon as PlanifyIconName) : null;

          return (
            <div
              key={item.label}
              className="flex items-center justify-center gap-2.5 text-center sm:justify-start sm:text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-100">
                {GoogleIcon ? (
                  <GoogleIcon className="h-5 w-5" />
                ) : planifyIcon ? (
                  <PlanifyIcon name={planifyIcon} className="h-4 w-4 text-cyan-600" />
                ) : null}
              </span>
              <span className="text-sm font-bold text-slate-800">{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
