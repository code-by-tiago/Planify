type GoogleProductIconProps = {
  product: GoogleProduct;
  className?: string;
};

export type GoogleProduct = "drive" | "docs" | "slides" | "forms" | "classroom";

/** Official Google Workspace product colors and shapes for export UI. */
const PRODUCT_VIEWBOX: Record<GoogleProduct, string> = {
  drive: "0 0 87.3 78",
  docs: "0 0 24 24",
  slides: "0 0 24 24",
  forms: "0 0 64 88",
  classroom: "0 0 24 24",
};

export function GoogleProductIcon({
  product,
  className = "h-4 w-4",
}: GoogleProductIconProps) {
  return (
    <svg
      viewBox={PRODUCT_VIEWBOX[product]}
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
        d="M6.6 66.85l3.58-10.23 21.65-44.31 38.37 0L6.6 66.85z"
      />
      <path
        fill="#00AC47"
        d="M85.23 19.39l-18.9-7.08L48.03 66.85l18.9 7.08L85.23 19.39z"
      />
      <path
        fill="#EA4335"
        d="M63.01 66.85 24.68 12.31 6.6 66.85h56.41z"
      />
      <path fill="#00832D" d="M43.03 0 24.68 12.31h41.65L43.03 0z" />
      <path
        fill="#2684FC"
        d="M6.6 66.85 24.68 12.31l-21.65 44.31L6.6 66.85z"
      />
      <path
        fill="#FFBA00"
        d="M66.33 12.31l18.9 7.08L63.01 66.85 48.03 66.85 66.33 12.31z"
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

/** Google Forms — official purple form with list fields. */
function FormsPaths() {
  return (
    <>
      <path
        fill="#56368A"
        d="M42 22 54.065 24.28 64 22 42 0 38.965 10.43Z"
      />
      <path
        fill="#7248B9"
        d="M42 22V0H6C2.685 0 0 2.685 0 6v76c0 3.315 2.685 6 6 6h52c3.315 0 6-2.685 6-6V22Z"
      />
      <path
        fill="#FFF"
        d="M17 63.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0-12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0-12a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM50 63H25v-5h25v5Zm0-12H25v-5h25v5Zm0-12H25v-5h25v5Z"
      />
    </>
  );
}

/** Google Classroom — green chalkboard with yellow roof and person silhouette. */
function ClassroomPaths() {
  return (
    <>
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
    </>
  );
}
