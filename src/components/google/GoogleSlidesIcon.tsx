type GoogleSlidesIconProps = {
  className?: string;
};

/** Official Google Slides product colors (brand integration). */
export function GoogleSlidesIcon({ className = "h-4 w-4" }: GoogleSlidesIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#F4B400"
        d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      />
      <path fill="#FDE293" d="M14 2v6h6L14 2z" />
      <rect fill="#FFF" x="7" y="11" width="10" height="7" rx="1" />
      <rect fill="#F4B400" x="8" y="13" width="8" height="1.5" rx=".75" />
      <rect fill="#F4B400" x="8" y="16" width="5" height="1.5" rx=".75" />
    </svg>
  );
}
