import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import { GoogleDocsIcon } from "@/components/google/GoogleDocsIcon";
import { GoogleDriveIcon } from "@/components/google/GoogleDriveIcon";
import { GoogleFormsIcon } from "@/components/google/GoogleFormsIcon";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { TRUST_ITEMS } from "./constants";

const GOOGLE_PRODUCT_ICONS = {
  drive: GoogleDriveIcon,
  forms: GoogleFormsIcon,
  docs: GoogleDocsIcon,
  classroom: GoogleClassroomIcon,
} as const;

export function LandingTrustBar() {
  return (
    <section className="bg-[#F0F9FA] px-5 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-3 sm:max-w-7xl sm:grid-cols-4 sm:gap-4">
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
              className="group flex min-w-0 items-center gap-2 rounded-2xl bg-white/70 px-2.5 py-2 text-left shadow-sm ring-1 ring-cyan-100/70 sm:justify-center sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:ring-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm transition group-hover:grayscale-0 grayscale-[0.35] group-hover:opacity-100 opacity-80">
                {GoogleIcon ? (
                  <GoogleIcon className="h-5 w-5 object-contain transition group-hover:scale-105" />
                ) : planifyIcon ? (
                  <PlanifyIcon
                    name={planifyIcon}
                    className="h-4 w-4 text-[#26C6DA] transition group-hover:scale-105"
                  />
                ) : null}
              </span>
              <span className="min-w-0 text-xs font-bold leading-tight text-[#0A192F] sm:text-sm">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
