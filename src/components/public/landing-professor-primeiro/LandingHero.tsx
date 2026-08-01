export function LandingHero() {
  return (
    <section
      id="professores"
      className="relative h-[560px] scroll-mt-24 overflow-hidden bg-[#081728] md:h-[617px]"
      aria-labelledby="landing-hero-title"
    >
      <div
        className="absolute inset-0 bg-[url('/marketing/hero-backgrounds/planify-bncc-hero-photo.png')] bg-cover bg-[position:42%_center] md:bg-[url('/marketing/hero-backgrounds/planify-bncc-hero-final.png')] md:bg-center"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[#081728]/76 md:hidden" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,23,40,0.96)_0%,rgba(8,23,40,0.88)_58%,rgba(8,23,40,0.72)_100%)] md:hidden"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full items-center px-6 text-white md:sr-only">
        <div className="max-w-[350px]">
          <h1
            id="landing-hero-title"
            className="font-[family-name:var(--font-display)] text-[36px] font-extrabold leading-[1.16] tracking-normal"
          >
            Planejamento BNCC
            <br />
            pronto em <span className="text-[#25C8DD]">minutos.</span>
          </h1>
          <p className="mt-5 text-[15px] font-semibold leading-[1.55] text-white">
            Planify é o assistente digital essencial para educadores. Transformamos exigências
            curriculares complexas em materiais prontos para uso através de IA, automatizando a
            burocracia pedagógica.
          </p>
        </div>
      </div>
    </section>
  );
}
