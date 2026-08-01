import Image from "next/image";
import Link from "next/link";
import styles from "./landing-create-block.module.css";

const showcaseItems = [
  {
    title: "Planejamento – Anual + Trimestrais",
    href: "/planejamento-escolar-com-ia",
    image: "/marketing/create-showcase/planejamento-anual.png",
    alt: "Prévia de um planejamento anual com tabela trimestral",
  },
  {
    title: "PEI – Plano Individualizado",
    href: "/pei",
    image: "/marketing/create-showcase/pei-plano-individualizado.png",
    alt: "Prévia de um PEI individualizado",
  },
  {
    title: "Avaliação – Google Forms",
    href: "/gerador-de-provas-com-ia",
    image: "/marketing/create-showcase/avaliacao-google-forms.png",
    alt: "Prévia de avaliação no Google Forms",
  },
  {
    title: "Atividade – Cruzadinha",
    href: "/cruzadinha",
    image: "/marketing/create-showcase/atividade-cruzadinha.png",
    alt: "Prévia de atividade de cruzadinha",
  },
] as const;

export function LandingCreateBlock() {
  return (
    <section
      className={styles.section}
      aria-label="Modelos de materiais Planify"
      data-landing-showcase
    >
      <div className={styles.header}>
        <h2 className={styles.title}>
          Alguns Exemplos de Materiais que o Planify Entrega Pronto
        </h2>
      </div>
      <div className={styles.grid}>
        {showcaseItems.map((item) => (
          <Link key={item.title} href={item.href} className={styles.card}>
            <span className={styles.media}>
              <Image
                src={item.image}
                alt={item.alt}
                width={552}
                height={404}
                sizes="(min-width: 1280px) 276px, (min-width: 768px) 42vw, 86vw"
                className={styles.image}
              />
            </span>
            <span className={styles.caption}>
              <span className={styles.accent} aria-hidden="true" />
              <span>{item.title}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
