import { PageShell } from "../../components/PageShell";
import { MateriaisClient } from "./MateriaisClient";

export const dynamic = "force-dynamic";

export default function MateriaisPage() {
  return (
    <PageShell>
      <MateriaisClient />
    </PageShell>
  );
}
