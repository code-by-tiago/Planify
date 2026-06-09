import { GoogleProductIcon } from "@/components/google/GoogleProductIcon";

type GoogleClassroomIconProps = {
  className?: string;
};

export function GoogleClassroomIcon({
  className = "h-4 w-4",
}: GoogleClassroomIconProps) {
  return <GoogleProductIcon product="classroom" className={className} />;
}
