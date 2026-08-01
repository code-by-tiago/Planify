import { GoogleProductIcon } from "@/components/google/GoogleProductIcon";

type GoogleDocsIconProps = {
  className?: string;
};

export function GoogleDocsIcon({ className = "h-4 w-4" }: GoogleDocsIconProps) {
  return <GoogleProductIcon product="docs" className={className} />;
}
