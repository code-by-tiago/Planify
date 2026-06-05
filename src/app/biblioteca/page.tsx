import { PageShell } from "../../components/PageShell";
import { BibliotecaClient } from "./BibliotecaClient";

export const dynamic = "force-dynamic";

export default function BibliotecaPage() {
  return (
    <PageShell>
      <BibliotecaClient />
    </PageShell>
  );
}
