type PdfProductIconProps = {
  className?: string;
};

/** Ícone PDF vermelho — par com os produtos Google na barra de exportação. */
export function PdfProductIcon({ className = "h-5 w-5" }: PdfProductIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#E5252A"
        d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      />
      <path fill="#F49A9C" d="M14 2v6h6L14 2z" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="#FFF"
        fontSize="5.5"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        PDF
      </text>
    </svg>
  );
}
