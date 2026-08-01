import { redirect } from "next/navigation";

export default function CruzadinhaPage() {
  redirect("/dashboard?tipo=cruzadinha");
}
