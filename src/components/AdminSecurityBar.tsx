import Link from "next/link";
import { AdminLogoutButton } from "./AdminLogoutButton";

export function AdminSecurityBar() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-4 sm:px-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
            Sessão administrativa ativa
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Use “Sair Admin” ao terminar. Ao fechar a aba, será necessário login
            novamente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-indigo-200"
          >
            Admin
          </Link>
          <Link
            href="/admin/biblioteca"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-indigo-200"
          >
            Biblioteca
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
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
