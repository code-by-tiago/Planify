type GoogleDocsIconProps = {
  className?: string;
};

/** Official Google Docs product colors (brand integration). */
export function GoogleDocsIcon({ className = "h-4 w-4" }: GoogleDocsIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      />
      <path fill="#A1C2FA" d="M14 2v6h6L14 2z" />
      <rect fill="#FFF" x="7" y="13" width="10" height="2" rx="1" />
      <rect fill="#FFF" x="7" y="17" width="7" height="2" rx="1" />
    </svg>
  );
}
