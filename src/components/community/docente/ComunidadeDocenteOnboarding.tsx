"use client";

type ComunidadeDocenteOnboardingProps = {
  onOpenProfile: () => void;
  onCreatePost: () => void;
  onCreateGroup: () => void;
  onBrowseTeachers: () => void;
};

export function ComunidadeDocenteOnboarding({
  onOpenProfile,
  onCreatePost,
  onCreateGroup,
  onBrowseTeachers,
}: ComunidadeDocenteOnboardingProps) {
  const steps = [
    {
      step: "1",
      title: "Configure seu perfil público",
      description: "Adicione escola, bio e deixe seu perfil visível para outros professores.",
      action: "Abrir perfil",
      onClick: onOpenProfile,
    },
    {
      step: "2",
      title: "Publique sua primeira discussão",
      description: "Compartilhe uma dúvida, experiência ou material com a rede docente.",
      action: "Criar publicação",
      onClick: onCreatePost,
    },
    {
      step: "3",
      title: "Crie ou entre em um grupo",
      description: "Grupos de estudo ajudam a trocar ideias por disciplina ou tema.",
      action: "Criar grupo",
      onClick: onCreateGroup,
    },
    {
      step: "4",
      title: "Encontre colegas",
      description: "Busque professores, siga perfis e convide participantes nas publicações.",
      action: "Buscar professores",
      onClick: onBrowseTeachers,
    },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-[#0F172A]">Primeiros passos na comunidade</h2>
      <p className="mt-2 text-sm font-medium text-slate-600">
        Siga este roteiro para começar a interagir com outros professores.
      </p>
      <ol className="mt-5 space-y-3">
        {steps.map((item) => (
          <li
            key={item.step}
            className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-extrabold text-white">
                {item.step}
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">{item.title}</h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{item.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={item.onClick}
              className="shrink-0 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              {item.action}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
