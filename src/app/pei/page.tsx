import { redirect } from "next/navigation";

export default function PeiPage() {
  redirect("/dashboard?tipo=pei");
}
