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
    <section className="border-b border-indigo-100/60 bg-white/60 px-5 py-3 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-sm font-semibold leading-snug tracking-tight text-slate-900 sm:text-base">
          {title}
        </h1>

        <p className="mt-1.5 max-w-3xl text-xs leading-snug text-slate-500">
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
