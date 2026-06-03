import { PageShell } from "../../components/PageShell";
import { EditorClient } from "./EditorClient";

export const dynamic = "force-dynamic";

export default function EditorPage() {
  return (
    <PageShell>
      <div className="planify-ui3" id="editor">
        <EditorClient />
      </div>
    </PageShell>
  );
}
