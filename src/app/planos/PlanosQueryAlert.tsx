"use client";

import { useSearchParams } from "next/navigation";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

function getAlert(params: URLSearchParams) {
  if (params.get("premium") === "required") {
    return {
      type: "warning",
      title: "Plano ativo necessário",
      message: "Assine o Plano Professor para acessar as ferramentas premium.",
    };
  }
  if (params.get("cadastro") === "ok") {
    return {
      type: "warning",
      title: "Assine para começar",
      message: "Conclua a assinatura abaixo e crie sua senha na tela seguinte.",
    };
  }
  if (params.get("checkout") === "missing_plan") {
    return {
      type: "warning",
      title: "Assine o Plano Professor",
      message: "Inicie o checkout para liberar o acesso.",
    };
  }
  if (params.get("checkout") === "cancelled") {
    return {
      type: "warning",
      title: "Checkout cancelado",
      message: "Você pode assinar quando quiser.",
    };
  }
  if (params.get("checkout") === "error") {
    return {
      type: "error",
      title: "Não foi possível iniciar o checkout",
      message:
        params.get("message") || "Tente novamente em instantes ou fale com o suporte.",
    };
  }
  return null;
}

function alertClass(type: string) {
  if (type === "error") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function PlanosQueryAlert() {
  const searchParams = useSearchParams();
  const alert = getAlert(searchParams);

  if (!alert) {
    return null;
  }

  return (
    <div
      className={`mx-auto mb-8 flex max-w-3xl gap-3 rounded-2xl border p-4 ${alertClass(alert.type)}`}
    >
      <PlanifyIcon name="alertCircle" className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-bold">{alert.title}</p>
        <p className="mt-0.5 text-sm leading-6 opacity-90">{alert.message}</p>
      </div>
    </div>
  );
}
