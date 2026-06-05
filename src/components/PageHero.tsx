import { ButtonLink } from "./ButtonLink";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: PageHeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">
      <div className="max-w-4xl">
        <div className="mb-5 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-200 shadow-2xl shadow-cyan-500/10">
          {eyebrow}
        </div>

        <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
          {description}
        </p>

        {(primaryLabel || secondaryLabel) && (
          <div className="mt-7 flex flex-col gap-4 sm:flex-row">
            {primaryLabel && primaryHref && <ButtonLink href={primaryHref}>{primaryLabel}</ButtonLink>}
            {secondaryLabel && secondaryHref && <ButtonLink href={secondaryHref} variant="secondary">{secondaryLabel}</ButtonLink>}
          </div>
        )}
      </div>
    </section>
  );
}

export default PageHero;
