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
    <section className="border-b border-indigo-100/60 bg-white/60 px-5 py-10 sm:px-8 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <p className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
          {eyebrow}
        </p>

        <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
          {description}
        </p>

        {(primaryLabel || secondaryLabel) && (
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {primaryLabel && primaryHref ? (
              <ButtonLink href={primaryHref}>{primaryLabel}</ButtonLink>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <ButtonLink href={secondaryHref} variant="secondary">
                {secondaryLabel}
              </ButtonLink>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

export default PageHero;
