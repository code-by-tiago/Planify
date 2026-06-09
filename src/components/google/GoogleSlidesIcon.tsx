import { GoogleProductIcon } from "@/components/google/GoogleProductIcon";

type GoogleSlidesIconProps = {
  className?: string;
};

export function GoogleSlidesIcon({ className = "h-4 w-4" }: GoogleSlidesIconProps) {
  return <GoogleProductIcon product="slides" className={className} />;
}
