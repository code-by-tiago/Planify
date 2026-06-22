import { redirect } from "next/navigation";

/**
 * Rota de compatibilidade para links antigos. O banco agora é uma escolha
 * dentro dos fluxos de Provas e Listas, não uma página independente.
 */
export default function BancoQuestoesLegacyRedirect() {
  redirect("/materiais?tipo=prova");
}
