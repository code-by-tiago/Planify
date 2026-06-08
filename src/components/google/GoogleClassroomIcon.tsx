type GoogleClassroomIconProps = {
  className?: string;
};

/** Official Google Classroom product colors (brand integration). */
export function GoogleClassroomIcon({ className = "h-4 w-4" }: GoogleClassroomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#FBBC04"
        d="M12 3c-2.67 0-8 1.34-8 4v10c0 2.66 5.33 4 8 4s8-1.34 8-4V7c0-2.66-5.33-4-8-4z"
      />
      <path
        fill="#34A853"
        d="M12 3c2.67 0 8 1.34 8 4s-5.33 4-8 4S4 9.34 4 7s5.33-4 8-4z"
      />
      <ellipse fill="#188038" cx="12" cy="7" rx="8" ry="3.5" />
      <path
        fill="#FFF"
        d="M12 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"
      />
      <path
        fill="#1967D2"
        d="M4 10.5v6.5c0 2.66 5.33 4 8 4s8-1.34 8-4v-6.5c-2.13 1.78-5.47 2.5-8 2.5s-5.87-.72-8-2.5z"
      />
    </svg>
  );
}
