import Link from "next/link";
import { AdminLogoutButton } from "./AdminLogoutButton";

export function AdminSecurityBar() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 p-4 shadow-2xl shadow-cyan-500/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Sessão administrativa ativa
          </p>
          <p className="mt-1 text-sm text-cyan-100/80">
            Use “Sair Admin” ao terminar. Ao fechar a aba, será necessário login novamente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            Admin
          </Link>

          <Link
            href="/admin/biblioteca"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            Biblioteca Admin
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            Início
          </Link>

          <AdminLogoutButton />
        </div>
      </div>
    </div>
  );
}

export default AdminSecurityBar;
