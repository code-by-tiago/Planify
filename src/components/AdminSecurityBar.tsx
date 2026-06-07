import Link from "next/link";
import { AdminLogoutButton } from "./AdminLogoutButton";

export function AdminSecurityBar() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
      <div className="pl-admin-bar flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-cyan-400">Sessão do proprietário</p>
          <p className="mt-0.5 text-sm text-slate-400">
            Encerre com &quot;Sair Admin&quot; ao terminar. Fechar a aba exige novo login.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="pl-admin-btn-ghost px-4 py-2">
            Controle
          </Link>
          <Link href="/admin/biblioteca" className="pl-admin-btn-ghost px-4 py-2">
            Biblioteca
          </Link>
          <Link href="/" className="pl-admin-btn-ghost px-4 py-2">
            Início
          </Link>
          <AdminLogoutButton />
        </div>
      </div>
    </div>
  );
}

export default AdminSecurityBar;
