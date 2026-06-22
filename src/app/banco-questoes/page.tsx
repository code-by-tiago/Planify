import { redirect } from "next/navigation";

/**
 * Compatibilidade para links antigos: o banco agora é uma etapa de Provas e
 * Listas de exercícios, não uma ferramenta independente.
 */
export default function BancoQuestoesRedirectPage() {
  redirect("/materiais?tipo=prova");
}
