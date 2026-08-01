import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ userId: string }> };

export default async function MarketplaceProfileRedirectPage({ params }: PageProps) {
  const { userId } = await params;
  redirect(`/comunidade/professor/${userId}`);
}
