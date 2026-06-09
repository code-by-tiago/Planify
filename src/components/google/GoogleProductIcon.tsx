type GoogleProductIconProps = {
  product: GoogleProduct;
  className?: string;
};

export type GoogleProduct = "drive" | "docs" | "slides" | "forms" | "classroom";

/** Official Google Workspace product colors and shapes for export UI. */
export function GoogleProductIcon({
  product,
  className = "h-4 w-4",
}: GoogleProductIconProps) {
  return (
    <svg
      viewBox={product === "drive" ? "0 0 87.3 78" : "0 0 24 24"}
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {product === "drive" ? <DrivePaths /> : null}
      {product === "docs" ? <DocsPaths /> : null}
      {product === "slides" ? <SlidesPaths /> : null}
      {product === "forms" ? <FormsPaths /> : null}
      {product === "classroom" ? <ClassroomPaths /> : null}
    </svg>
  );
}

/** Google Drive — multicolor triangle (official brand shape). */
function DrivePaths() {
  return (
    <>
      <path
        fill="#0066DA"
        d="M6.6 66.85 3.03 56.62 24.68 12.31h38.37L6.6 66.85z"
      />
      <path
        fill="#00AC47"
        d="M85.23 19.39 66.33 12.31 48.03 66.85 66.93 73.93 85.23 19.39z"
      />
      <path
        fill="#EA4335"
        d="M63.01 66.85 24.68 12.31 6.6 66.85l56.41-.01z"
      />
      <path fill="#00832D" d="M43.03 0 24.68 12.31 66.33 12.31 43.03 0z" />
      <path
        fill="#2684FC"
        d="M6.6 66.85 24.68 12.31 3.03 56.62 6.6 66.85z"
      />
      <path
        fill="#FFBA00"
        d="M66.33 12.31 85.23 19.39 63.01 66.85 48.03 66.85 66.33 12.31z"
      />
    </>
  );
}

/** Google Docs — blue document with folded corner. */
function DocsPaths() {
  return (
    <>
      <path
        fill="#4285F4"
        d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      />
      <path fill="#A1C2FA" d="M14 2v6h6L14 2z" />
      <rect fill="#FFF" x="7" y="13" width="10" height="2" rx="1" />
      <rect fill="#FFF" x="7" y="17" width="7" height="2" rx="1" />
    </>
  );
}

/** Google Slides — yellow deck with slide preview. */
function SlidesPaths() {
  return (
    <>
      <path
        fill="#FBBC04"
        d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      />
      <path fill="#FDE293" d="M14 2v6h6L14 2z" />
      <rect fill="#FFF" x="7" y="11" width="10" height="7" rx="1" />
      <rect fill="#FBBC04" x="8" y="13" width="8" height="1.5" rx=".75" />
      <rect fill="#FBBC04" x="8" y="16" width="5" height="1.5" rx=".75" />
    </>
  );
}

/** Google Forms — purple list form. */
function FormsPaths() {
  return (
    <>
      <path
        fill="#7248B9"
        d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      />
      <path fill="#B39DDB" d="M14 2v6h6L14 2z" />
      <rect fill="#FFF" x="8" y="12" width="8" height="2" rx="1" />
      <rect fill="#FFF" x="8" y="16" width="8" height="2" rx="1" />
      <circle fill="#FFF" cx="9" cy="13" r="1" />
      <circle fill="#FFF" cx="9" cy="17" r="1" />
    </>
  );
}

/** Google Classroom — chalkboard with person silhouette. */
function ClassroomPaths() {
  return (
    <>
      <path
        fill="#0F9D58"
        d="M12 3C9.33 3 4 4.34 4 7v10c0 2.66 5.33 4 8 4s8-1.34 8-4V7c0-2.66-5.33-4-8-4z"
      />
      <path
        fill="#F4B400"
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
    </>
  );
}
