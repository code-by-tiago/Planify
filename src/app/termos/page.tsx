import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/public/LegalPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Termos de uso",
  description:
    "Condições de uso do Planify IA Educacional: planos, créditos, ferramentas de IA pedagógica e responsabilidades do professor.",
  path: "/termos",
});

const UPDATED = "5 de junho de 2026";

export default function TermosPage() {
  return (
    <LegalPageShell
      title="Termos de Uso"
      subtitle="Ao criar uma conta ou utilizar o Planify, você concorda com as condições abaixo. Leia com atenção antes de assinar um plano."
      updatedAt={UPDATED}
    >
      <section>
        <h2 className="text-lg font-black text-slate-900">1. O serviço</h2>
        <p className="mt-2">
          O Planify oferece ferramentas de inteligência artificial para apoio à
          prática docente: geração de materiais, planejamentos, editor, exportação
          (Google Docs, PDF), histórico, biblioteca e marketplace. O conteúdo é
          produzido com auxílio de IA e deve ser <strong>revisado pelo professor</strong>{" "}
          antes do uso em sala, provas ou documentos oficiais.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">2. Conta e elegibilidade</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Você deve fornecer informações verdadeiras no cadastro.</li>
          <li>É responsável por manter sua senha em sigilo.</li>
          <li>O serviço é voltado a educadores; o uso comercial não autorizado da
            plataforma ou de seus conteúdos internos é proibido.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">3. Planos, créditos e pagamento</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            O acesso às ferramentas de IA está vinculado a <strong>planos pagos</strong>{" "}
            com créditos por ciclo (mensal ou anual), conforme descrito em{" "}
            <Link href="/planos" className="font-bold text-cyan-700 hover:underline">
              Planos
            </Link>
            .
          </li>
          <li>Cada geração consome créditos conforme o tipo de ferramenta.</li>
          <li>Pagamentos são processados pelo Stripe; renovações seguem as regras do
            plano escolhido.</li>
          <li>Não há freemium diário: sem plano ativo ou créditos, a geração é
            bloqueada.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">4. Uso aceitável</h2>
        <p className="mt-2">Você concorda em não:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>usar o Planify para conteúdo ilegal, discriminatório ou que viole direitos
            de terceiros;</li>
          <li>inserir dados pessoais sensíveis de alunos nos geradores de IA;</li>
          <li>tentar burlar limites de créditos, acesso ou segurança;</li>
          <li>fazer engenharia reversa ou sobrecarga intencional dos sistemas.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">5. Conteúdo gerado e propriedade</h2>
        <p className="mt-2">
          Os materiais que você gera, edita e exporta são de sua responsabilidade
          pedagógica e institucional. Salvo disposição legal em contrário, você pode
          utilizar os textos e documentos produzidos em sua prática docente. O Planify
          não garante adequação automática a normas de rede de ensino, avaliações
          externas ou exigências específicas de secretarias — a revisão final é sua.
        </p>
        <p className="mt-2">
          Materiais publicados no marketplace seguem as regras da comunidade e podem ser
          visualizados por outros usuários conforme as funcionalidades da plataforma.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">6. Limitações da IA</h2>
        <p className="mt-2">
          Resultados de IA podem conter imprecisões. O Planify não substitui seu
          julgamento profissional, formação continuada nem diretrizes oficiais da BNCC e
          da sua instituição. Em caso de dúvida pedagógica, consulte coordenação ou
          referências curriculares oficiais.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">7. Integrações Google</h2>
        <p className="mt-2">
          Ao conectar sua conta Google, você autoriza o Planify a exportar arquivos e
          criar atividades conforme as permissões solicitadas (Drive, Classroom,
          Apresentações). Você pode desconectar a qualquer momento no editor. O uso
          desses serviços também está sujeito aos termos do Google.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">8. Disponibilidade e alterações</h2>
        <p className="mt-2">
          Buscamos alta disponibilidade, mas podem ocorrer manutenções, limites de API de
          terceiros (ex.: cotas de IA) ou indisponibilidades temporárias. Funcionalidades
          podem evoluir; alterações relevantes nestes termos serão refletidas nesta
          página com data de atualização.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">9. Cancelamento</h2>
        <p className="mt-2">
          Você pode cancelar a assinatura conforme as opções do Stripe e do painel de
          planos. O cancelamento interrompe novas cobranças; créditos e acesso seguem as
          regras do ciclo já pago. Podemos suspender contas que violem estes termos.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">10. Privacidade</h2>
        <p className="mt-2">
          O tratamento de dados pessoais é descrito na{" "}
          <Link
            href="/privacidade"
            className="font-bold text-cyan-700 hover:underline"
          >
            Política de Privacidade
          </Link>
          , parte integrante destes termos.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">11. Lei aplicável e foro</h2>
        <p className="mt-2">
          Estes termos são regidos pelas leis da República Federativa do Brasil. Eventuais
          controvérsias serão resolvidas no foro da comarca do domicílio do usuário,
          salvo disposição legal em contrário.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-900">12. Contato</h2>
        <p className="mt-2">
          Dúvidas sobre estes termos:{" "}
          <Link href="/contato" className="font-bold text-cyan-700 hover:underline">
            página de contato
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
