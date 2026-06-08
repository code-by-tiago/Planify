type GoogleFormsIconProps = {
  className?: string;
};

/** Official Google Forms product colors (brand integration). */
export function GoogleFormsIcon({ className = "h-4 w-4" }: GoogleFormsIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#7248B9"
        d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      />
      <path fill="#B39DDB" d="M14 2v6h6L14 2z" />
      <rect fill="#FFF" x="8" y="12" width="8" height="2" rx="1" />
      <rect fill="#FFF" x="8" y="16" width="8" height="2" rx="1" />
      <circle fill="#FFF" cx="9" cy="13" r="1" />
      <circle fill="#FFF" cx="9" cy="17" r="1" />
    </svg>
  );
}
