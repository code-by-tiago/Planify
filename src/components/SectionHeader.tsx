type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "center" | "left";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeaderProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base font-medium leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}
