import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicAnchorNav } from "@/components/public/PublicAnchorNav";
import StudioSessionRedirect from "@/components/dashboard/StudioSessionRedirect";
import { PlanifyHomePage } from "@/components/public/landing/PlanifyHomePage";

export default function HomePage() {
  return (
    <main className="planify-ui3 planify-public min-h-screen">
      <StudioSessionRedirect />
      <PublicHeader active="home" />
      <PublicAnchorNav />
      <PlanifyHomePage />
      <PublicFooter />
    </main>
  );
}
