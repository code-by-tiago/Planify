export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0A192F] px-6 text-center text-white">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
        Planify
      </p>
      <h1 className="mt-3 text-2xl font-extrabold">Sem conexão</h1>
      <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-slate-300">
        O shell do Planify está disponível offline. Para gerar materiais com IA,
        reconecte-se à internet. Seus rascunhos locais continuam no histórico do
        aparelho.
      </p>
      <a
        href="/dashboard"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#26C6DA] px-5 text-sm font-extrabold text-[#0A192F]"
      >
        Tentar abrir o painel
      </a>
    </main>
  );
}
