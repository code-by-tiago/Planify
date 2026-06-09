import { GoogleProductIcon } from "@/components/google/GoogleProductIcon";

type GoogleDriveIconProps = {
  className?: string;
};

export function GoogleDriveIcon({ className = "h-4 w-4" }: GoogleDriveIconProps) {
  return <GoogleProductIcon product="drive" className={className} />;
}
