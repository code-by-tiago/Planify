"use client";

import { GoogleClassroomPopoverButton } from "@/components/google/GoogleClassroomPopoverButton";

export default function GoogleClassroomResumeTestPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Google Classroom Resume Test</h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta página é uma área de teste para o popover Classroom após retorno OAuth.
        </p>

        <div className="mt-8">
          <GoogleClassroomPopoverButton
            title="Teste"
            getHtml={() => "<p>Conteúdo de teste para exportação ao Classroom.</p>"}
            returnTo="/test/google-classroom-resume"
            documentType="teste"
          />
        </div>
      </div>
    </main>
  );
}
