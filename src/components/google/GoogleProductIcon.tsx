type GoogleProductIconProps = {
  product: GoogleProduct;
  className?: string;
};

export type GoogleProduct = "drive" | "docs" | "slides" | "forms" | "classroom";

/** Official Google Workspace product colors and shapes for export UI. */
const PRODUCT_VIEWBOX: Record<Exclude<GoogleProduct, "drive" | "classroom">, string> = {
  docs: "0 0 24 24",
  slides: "0 0 24 24",
  forms: "0 0 64 88",
};

const OFFICIAL_ICON_SRC: Partial<Record<GoogleProduct, string>> = {
  drive: "/icons/google-drive.svg",
  classroom: "/icons/google-classroom.svg",
};

export function GoogleProductIcon({
  product,
  className = "h-4 w-4",
}: GoogleProductIconProps) {
  const officialSrc = OFFICIAL_ICON_SRC[product];
  if (officialSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={officialSrc}
        alt=""
        aria-hidden="true"
        className={className}
        draggable={false}
      />
    );
  }

  return (
    <svg
      viewBox={PRODUCT_VIEWBOX[product as Exclude<GoogleProduct, "drive" | "classroom">]}
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {product === "docs" ? <DocsPaths /> : null}
      {product === "slides" ? <SlidesPaths /> : null}
      {product === "forms" ? <FormsPaths /> : null}
    </svg>
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
