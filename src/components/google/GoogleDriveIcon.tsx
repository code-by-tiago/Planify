type GoogleDriveIconProps = {
  className?: string;
};

/** Official Google Drive product colors (brand integration). */
export function GoogleDriveIcon({ className = "h-4 w-4" }: GoogleDriveIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#0066DA" d="M7.71 3.5 1.15 15h6.56L14.29 3.5H7.71z" />
      <path fill="#00AC47" d="M1.15 15 7.71 26.5h6.58L1.15 15z" transform="translate(0 -11.5)" />
      <path fill="#EA4335" d="M16.29 3.5 9.73 15h6.56l6.56-11.5h-6.56z" />
      <path fill="#00832D" d="M9.73 15 16.29 3.5H22.85L16.29 15H9.73z" />
      <path fill="#2684FC" d="M1.15 15 7.71 3.5h6.58L7.71 15H1.15z" />
      <path fill="#FFBA00" d="M9.73 15 16.29 3.5h6.56L16.29 15H9.73z" />
    </svg>
  );
}
