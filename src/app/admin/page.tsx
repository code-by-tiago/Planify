import { getOwnerPageAccess } from "../../server/auth/owner-access";
import { OwnerAccessGate } from "../../components/OwnerAccessGate";
import { AdminSecurityBar } from "../../components/AdminSecurityBar";
import { AdminTabSessionGuard } from "../../components/AdminTabSessionGuard";
import { PageShell } from "../../components/PageShell";
import { AdminControleClient } from "./AdminControleClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const owner = await getOwnerPageAccess();

  if (!owner.authenticated || !owner.isOwner) {
    return (
      <PageShell>
        <OwnerAccessGate
          authenticated={owner.authenticated}
          email={owner.email}
          redirectTo="/admin"
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="planify-hud planify-admin min-h-0 flex-1 overflow-y-auto">
        <AdminTabSessionGuard>
          <AdminSecurityBar />
          <AdminControleClient />
        </AdminTabSessionGuard>
      </div>
    </PageShell>
  );
}
