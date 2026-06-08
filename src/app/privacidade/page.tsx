import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/public/LegalPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Política de privacidade",
  description:
    "Como o Planify IA Educacional trata dados pessoais de professores, integrações Google e pagamentos, em conformidade com a LGPD.",
  path: "/privacidade",
});

const UPDATED = "5 de junho de 2026";

export default function PrivacidadePage() {
  return (
    <LegalPageShell
      title="Política de Privacidade"
      subtitle="Transparência sobre como coletamos, usamos e protegemos seus dados no Planify — plataforma de IA pedagógica para professores no Brasil."
      updatedAt={UPDATED}
    >
      <section>
        <h2 className="text-lg font-black text-slate-900">1. Quem somos</h2>
        <p className="mt-2">
          O <strong>Planify</strong> é uma plataforma digital voltada a professores da
          Educação Básica brasileira, com ferramentas de inteligência artificial para
          criação de materiais didáticos, planejamentos alinhados à BNCC, editor de
          documentos e integrações com serviços Google (Drive, Apresentações e
          Classroom).
        </p>
        <p className="mt-2">
          Para questões sobre privacidade e proteção de dados, utilize a página de{" "}
          <Link href="/contato" className="font-bold text-cyan-700 hover:underline">
            contato
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">2. Dados que coletamos</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>Cadastro e conta:</strong> nome, e-mail e credenciais de acesso
            (gerenciadas via Supabase Auth).
          </li>
          <li>
            <strong>Uso do serviço:</strong> materiais gerados, histórico, documentos
            salvos no editor, preferências de ferramentas e consumo de créditos do
            plano.
          </li>
          <li>
            <strong>Pagamentos:</strong> dados de assinatura processados pelo{" "}
            <strong>Stripe</strong> (não armazenamos número completo de cartão em nossos
            servidores).
          </li>
          <li>
            <strong>Integração Google (opcional):</strong> quando você conecta sua conta
            Google, armazenamos tokens de autorização de forma segura no servidor para
            exportar apresentações e enviar materiais ao Google Classroom. Não vendemos
            nem compartilhamos esses tokens com terceiros.
          </li>
          <li>
            <strong>Técnicos:</strong> logs de acesso, endereço IP, tipo de navegador e
            cookies necessários para manter sua sessão autenticada.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">3. Como usamos seus dados</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Autenticar você e liberar o acesso conforme seu plano ativo.</li>
          <li>Gerar materiais pedagógicos com IA (Google Gemini) a partir dos dados que
            você informa (tema, disciplina, ano/série, objetivos).</li>
          <li>Debitar créditos do plano, exibir saldo e histórico de uso.</li>
          <li>Exportar documentos para Google Apresentações e Classroom, quando
            solicitado por você.</li>
          <li>Melhorar estabilidade, segurança e suporte ao usuário.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">4. Inteligência artificial</h2>
        <p className="mt-2">
          Para gerar conteúdos, o Planify envia à API do <strong>Google Gemini</strong>{" "}
          as informações necessárias ao pedido (tema, etapa escolar, instruções
          pedagógicas e trechos que você submete). Não utilize dados sensíveis de
          alunos identificáveis nos campos de geração. Revise sempre o material antes de
          aplicar em sala.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">5. Compartilhamento com terceiros</h2>
        <p className="mt-2">Compartilhamos dados apenas com provedores essenciais ao serviço:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>Supabase</strong> — banco de dados e autenticação
          </li>
          <li>
            <strong>Stripe</strong> — cobrança de assinaturas
          </li>
          <li>
            <strong>Google Cloud</strong> — IA (Gemini) e integrações OAuth (Drive,
            Classroom, Apresentações)
          </li>
          <li>
            <strong>Vercel</strong> — hospedagem da aplicação
          </li>
        </ul>
        <p className="mt-2">
          Não vendemos sua base de dados. O marketplace do Planify só publica materiais
          que você explicitamente escolher compartilhar.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">6. Cookies e armazenamento local</h2>
        <p className="mt-2">
          Utilizamos cookies e armazenamento local do navegador para manter sua sessão,
          preferências do painel e documentos em edição. Você pode limpar cookies no
          navegador; isso pode encerrar sua sessão no Planify.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">7. Seus direitos (LGPD)</h2>
        <p className="mt-2">
          Nos termos da Lei nº 13.709/2018 (LGPD), você pode solicitar:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>confirmação do tratamento e acesso aos dados;</li>
          <li>correção de dados incompletos ou desatualizados;</li>
          <li>eliminação de dados desnecessários, quando aplicável;</li>
          <li>revogação do consentimento para integrações opcionais (ex.: desconectar
            Google no editor).</li>
        </ul>
        <p className="mt-2">
          Envie pedidos pela página de{" "}
          <Link href="/contato" className="font-bold text-cyan-700 hover:underline">
            contato
          </Link>
          , assunto &quot;Privacidade e dados pessoais&quot;.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">8. Retenção e segurança</h2>
        <p className="mt-2">
          Mantemos os dados enquanto sua conta estiver ativa ou conforme exigências
          legais. Aplicamos controles de acesso, HTTPS e armazenamento de tokens
          sensíveis apenas no servidor. Nenhum sistema é 100% invulnerável; em caso de
          incidente relevante, comunicaremos os usuários afetados quando a lei exigir.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">9. Menores de idade</h2>
        <p className="mt-2">
          O Planify é destinado a <strong>professores e educadores</strong>. Não
          coletamos intencionalmente dados de crianças para cadastro. Materiais gerados
          devem ser usados pelo professor em contexto pedagógico, sem expor dados
          pessoais de estudantes nos formulários de IA.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">10. Alterações</h2>
        <p className="mt-2">
          Podemos atualizar esta política para refletir mudanças no produto ou na
          legislação. A data da versão vigente aparece no topo desta página.
        </p>
      </section>
    </LegalPageShell>
  );
}
