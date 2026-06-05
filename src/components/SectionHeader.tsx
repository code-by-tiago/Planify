type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "center" | "left";
};

export function SectionHeader({ eyebrow, title, description, align = "center" }: SectionHeaderProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">
        {description}
      </p>
    </div>
  );
}