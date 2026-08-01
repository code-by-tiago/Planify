import { GoogleProductIcon } from "@/components/google/GoogleProductIcon";

type GoogleFormsIconProps = {
  className?: string;
};

export function GoogleFormsIcon({ className = "h-4 w-4" }: GoogleFormsIconProps) {
  return <GoogleProductIcon product="forms" className={className} />;
}
