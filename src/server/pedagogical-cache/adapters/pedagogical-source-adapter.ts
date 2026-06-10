export type PedagogicalScrapeQuery = {
  tema: string;
  componente?: string;
  anoSerie?: string;
  etapa?: string;
  bnccCodigos?: string[];
};

export type PedagogicalScrapeResult = {
  title: string;
  summary: string;
  bodyMarkdown: string;
  sourceUrl: string;
  sourceTitle: string;
  license: string;
  contentType: "context" | "definition" | "orientation";
  bnccCodigos?: string[];
  confidence: number;
};

export interface PedagogicalSourceAdapter {
  slug: string;
  canHandle(query: PedagogicalScrapeQuery): boolean;
  fetch(query: PedagogicalScrapeQuery): Promise<PedagogicalScrapeResult | null>;
}
