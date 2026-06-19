import { redirect } from "next/navigation";
import { normalizeReferralCode } from "@/server/referral/referral-service";

type CadastroPageProps = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function CadastroPage({ searchParams }: CadastroPageProps) {
  const params = await searchParams;
  const code = normalizeReferralCode(params.ref);

  if (code) {
    redirect(`/planos?ref=${encodeURIComponent(code)}`);
  }

  redirect("/planos");
}
