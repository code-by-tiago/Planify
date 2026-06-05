import { PageShell } from "../../components/PageShell";
import { EditorClient } from "./EditorClient";

export const dynamic = "force-dynamic";

export default function EditorPage() {
  return (
    <PageShell>
      <div id="editor">
        <EditorClient />
      </div>
    </PageShell>
  );
}
