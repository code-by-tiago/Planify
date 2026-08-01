import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planify — Assistente do Professor",
    short_name: "Planify",
    description:
      "Gere listas, provas e materiais pedagógicos alinhados à BNCC pelo celular.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0A192F",
    theme_color: "#00d4ff",
    lang: "pt-BR",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/brand/planify-owl-graduate.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/planify-owl-graduate.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
