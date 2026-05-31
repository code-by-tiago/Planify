"use client";

import { useEffect, useRef } from "react";

type StageConfig = {
  years: string[];
  areas: string[];
  componentsByArea: Record<string, string[]>;
};

const STAGE_INFANTIL = "Educa\u00e7\u00e3o Infantil";
const STAGE_FUNDAMENTAL = "Ensino Fundamental";
const STAGE_MEDIO = "Ensino M\u00e9dio";

const AREA_CAMPOS = "Campos de experi\u00eancias";
const AREA_LINGUAGENS_FUND = "Linguagens";
const AREA_MATEMATICA_FUND = "Matem\u00e1tica";
const AREA_CIENCIAS_NATUREZA_FUND = "Ci\u00eancias da Natureza";
const AREA_CIENCIAS_HUMANAS_FUND = "Ci\u00eancias Humanas";
const AREA_ENSINO_RELIGIOSO = "Ensino Religioso";

const AREA_LINGUAGENS_MEDIO = "Linguagens e suas Tecnologias";
const AREA_MATEMATICA_MEDIO = "Matem\u00e1tica e suas Tecnologias";
const AREA_CIENCIAS_NATUREZA_MEDIO = "Ci\u00eancias da Natureza e suas Tecnologias";
const AREA_CIENCIAS_HUMANAS_MEDIO = "Ci\u00eancias Humanas e Sociais Aplicadas";

const EDUCATION_DATA: Record<string, StageConfig> = {
  [STAGE_INFANTIL]: {
    years: ["Ber\u00e7\u00e1rio", "Maternal I", "Maternal II", "Pr\u00e9 I", "Pr\u00e9 II"],
    areas: [AREA_CAMPOS],
    componentsByArea: {
      [AREA_CAMPOS]: [
        "O eu, o outro e o n\u00f3s",
        "Corpo, gestos e movimentos",
        "Tra\u00e7os, sons, cores e formas",
        "Escuta, fala, pensamento e imagina\u00e7\u00e3o",
        "Espa\u00e7os, tempos, quantidades, rela\u00e7\u00f5es e transforma\u00e7\u00f5es",
      ],
    },
  },
  [STAGE_FUNDAMENTAL]: {
    years: [
      "1\u00ba ano",
      "2\u00ba ano",
      "3\u00ba ano",
      "4\u00ba ano",
      "5\u00ba ano",
      "6\u00ba ano",
      "7\u00ba ano",
      "8\u00ba ano",
      "9\u00ba ano",
    ],
    areas: [
      AREA_LINGUAGENS_FUND,
      AREA_MATEMATICA_FUND,
      AREA_CIENCIAS_NATUREZA_FUND,
      AREA_CIENCIAS_HUMANAS_FUND,
      AREA_ENSINO_RELIGIOSO,
    ],
    componentsByArea: {
      [AREA_LINGUAGENS_FUND]: [
        "L\u00edngua Portuguesa",
        "Arte",
        "Educa\u00e7\u00e3o F\u00edsica",
        "L\u00edngua Inglesa",
      ],
      [AREA_MATEMATICA_FUND]: ["Matem\u00e1tica"],
      [AREA_CIENCIAS_NATUREZA_FUND]: ["Ci\u00eancias"],
      [AREA_CIENCIAS_HUMANAS_FUND]: ["Hist\u00f3ria", "Geografia"],
      [AREA_ENSINO_RELIGIOSO]: ["Ensino Religioso"],
    },
  },
  [STAGE_MEDIO]: {
    years: ["1\u00aa s\u00e9rie", "2\u00aa s\u00e9rie", "3\u00aa s\u00e9rie"],
    areas: [
      AREA_LINGUAGENS_MEDIO,
      AREA_MATEMATICA_MEDIO,
      AREA_CIENCIAS_NATUREZA_MEDIO,
      AREA_CIENCIAS_HUMANAS_MEDIO,
    ],
    componentsByArea: {
      [AREA_LINGUAGENS_MEDIO]: [
        "L\u00edngua Portuguesa",
        "Arte",
        "Educa\u00e7\u00e3o F\u00edsica",
        "L\u00edngua Inglesa",
        "L\u00edngua Espanhola",
      ],
      [AREA_MATEMATICA_MEDIO]: ["Matem\u00e1tica"],
      [AREA_CIENCIAS_NATUREZA_MEDIO]: ["Biologia", "F\u00edsica", "Qu\u00edmica"],
      [AREA_CIENCIAS_HUMANAS_MEDIO]: [
        "Hist\u00f3ria",
        "Geografia",
        "Filosofia",
        "Sociologia",
      ],
    },
  },
};

const MATERIAL_TYPES = [
  "Atividade",
  "Avalia\u00e7\u00e3o",
  "Apostila",
  "Sequ\u00eancia did\u00e1tica",
  "Projeto",
  "Roteiro de aula",
  "Jogo pedag\u00f3gico",
  "Din\u00e2mica",
  "Resumo",
  "Lista de exerc\u00edcios",
];

const PLANNING_TYPES = ["Anual", "Trimestral", "Anual + trimestral"];
const TRIMESTERS = ["1\u00ba trimestre", "2\u00ba trimestre", "3\u00ba trimestre"];

const TEXT_FIXES: Array<[RegExp, string]> = [
  [new RegExp("Informa\\u00c3\\u00a7\\u00c3\\u00b5es", "g"), "Informa\u00e7\u00f5es"],
  [new RegExp("informa\\u00c3\\u00a7\\u00c3\\u00b5es", "g"), "informa\u00e7\u00f5es"],
  [new RegExp("avalia\\u00c3\\u00a7\\u00c3\\u00b5es", "g"), "avalia\u00e7\u00f5es"],
  [new RegExp("Avalia\\u00c3\\u00a7\\u00c3\\u00b5es", "g"), "Avalia\u00e7\u00f5es"],
  [new RegExp("sequ\\u00c3\\u00aancias", "g"), "sequ\u00eancias"],
  [new RegExp("did\\u00c3\\u00a1ticas", "g"), "did\u00e1ticas"],
  [new RegExp("produ\\u00c3\\u00a7\\u00c3\\u00a3o", "g"), "produ\u00e7\u00e3o"],
  [new RegExp("interpreta\\u00c3\\u00a7\\u00c3\\u00a3o", "g"), "interpreta\u00e7\u00e3o"],
  [new RegExp("quest\\u00c3\\u00b5es", "g"), "quest\u00f5es"],
  [new RegExp("Dura\\u00c3\\u00a7\\u00c3\\u00a3o", "g"), "Dura\u00e7\u00e3o"],
  [new RegExp("Ano/S\\u00c3\\u00a9rie", "g"), "Ano/S\u00e9rie"],
  [new RegExp("S\\u00c3\\u00a9rie", "g"), "S\u00e9rie"],
  [new RegExp("T\\u00c3\\u00adtulo", "g"), "T\u00edtulo"],
  [new RegExp("Conte\\u00c3\\u00bados", "g"), "Conte\u00fados"],
  [new RegExp("pedag\\u00c3\\u00b3gic", "g"), "pedag\u00f3gic"],
  [new RegExp("curr\\u00c3\\u00adcular", "g"), "curricular"],
  [new RegExp("\\u00c3\\u00a1", "g"), "\u00e1"],
  [new RegExp("\\u00c3\\u00a9", "g"), "\u00e9"],
  [new RegExp("\\u00c3\\u00ad", "g"), "\u00ed"],
  [new RegExp("\\u00c3\\u00b3", "g"), "\u00f3"],
  [new RegExp("\\u00c3\\u00ba", "g"), "\u00fa"],
  [new RegExp("\\u00c3\\u00a3", "g"), "\u00e3"],
  [new RegExp("\\u00c3\\u00b5", "g"), "\u00f5"],
  [new RegExp("\\u00c3\\u00a7", "g"), "\u00e7"],
  [new RegExp("\\u00c2\\u00ba", "g"), "\u00ba"],
  [new RegExp("\\u00c2\\u00aa", "g"), "\u00aa"],
  [new RegExp("\\u00c2", "g"), ""],
  [
    /Materiais did\u00e1ticos oficiais cadastrados pelo administrador\./gi,
    "Materiais did\u00e1ticos premium selecionados para apoiar sua rotina pedag\u00f3gica.",
  ],
  [
    /Acesse apenas recursos reais anexados e publicados pelo admin do Planify\./gi,
    "Acesse recursos reais e organizados para usar, adaptar e baixar quando precisar.",
  ],
  [/cadastrados pelo administrador/gi, "selecionados para professores"],
  [/publicados pelo admin/gi, "dispon\u00edveis na Biblioteca Premium"],
  [/pelo administrador/gi, "pela curadoria Planify"],
  [/sem materiais fict\u00edcios/gi, "com materiais reais"],
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s/+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function fixText(value: string) {
  let next = value;

  for (const [pattern, replacement] of TEXT_FIXES) {
    next = next.replace(pattern, replacement);
  }

  return next;
}

function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;

  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function safeLabelSelector(id: string) {
  return id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getFieldLabel(field: HTMLElement) {
  const id = field.getAttribute("id");

  if (id) {
    const direct = document.querySelector(`label[for="${safeLabelSelector(id)}"]`);
    if (direct?.textContent) {
      return direct.textContent;
    }
  }

  const labelParent = field.closest("label");
  if (labelParent?.textContent) {
    return labelParent.textContent;
  }

  const wrapper = field.closest("div");
  if (wrapper?.textContent) {
    const labels = Array.from(wrapper.querySelectorAll("label, span, p, strong"))
      .map((item) => item.textContent || "")
      .filter(Boolean);

    return labels[0] || wrapper.textContent || "";
  }

  return field.getAttribute("placeholder") || field.getAttribute("name") || "";
}

function getAllFields() {
  return Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]):not([type="file"]), textarea, select',
    ),
  );
}

type FieldKind =
  | "stage"
  | "year"
  | "area"
  | "component"
  | "planningType"
  | "trimester"
  | "materialType";

function findFieldByKind(kind: FieldKind) {
  const fields = getAllFields();

  for (const field of fields) {
    const label = normalizeText(
      [
        getFieldLabel(field),
        field.getAttribute("name") || "",
        field.getAttribute("id") || "",
        field.getAttribute("placeholder") || "",
      ].join(" "),
    );

    if (kind === "stage" && /\b(etapa|ensino)\b/.test(label)) return field;
    if (kind === "year" && /(ano serie|anoserie|serie|ano\/serie)/.test(label)) return field;
    if (kind === "area" && /(area|conhecimento|campo de experiencia|campo)/.test(label)) return field;
    if (kind === "component" && /(componente|curricular|disciplina)/.test(label)) return field;
    if (kind === "planningType" && /(tipo|planejamento)/.test(label)) return field;
    if (kind === "trimester" && /(trimestre)/.test(label)) return field;
    if (kind === "materialType" && /(tipo do material|tipo de material|material)/.test(label)) return field;
  }

  return null;
}

function getStageValue() {
  const field = findFieldByKind("stage");
  const value = field?.value || "";

  if (/infantil/i.test(value)) return STAGE_INFANTIL;
  if (/m[e\u00e9]dio/i.test(value)) return STAGE_MEDIO;
  return STAGE_FUNDAMENTAL;
}

function getAreaValue() {
  return findFieldByKind("area")?.value || "";
}

function getOptionsForKind(kind: FieldKind) {
  const stage = getStageValue();
  const config = EDUCATION_DATA[stage] || EDUCATION_DATA[STAGE_FUNDAMENTAL];

  if (kind === "stage") return Object.keys(EDUCATION_DATA);
  if (kind === "year") return config.years;
  if (kind === "area") return config.areas;

  if (kind === "component") {
    const area = getAreaValue();
    const exact = config.componentsByArea[area];

    if (exact?.length) return exact;

    return Object.values(config.componentsByArea).flat();
  }

  if (kind === "planningType") return PLANNING_TYPES;
  if (kind === "trimester") return TRIMESTERS;
  if (kind === "materialType") return MATERIAL_TYPES;

  return [];
}

function fieldKind(field: HTMLElement): FieldKind | null {
  const label = normalizeText(
    [
      getFieldLabel(field),
      field.getAttribute("name") || "",
      field.getAttribute("id") || "",
      field.getAttribute("placeholder") || "",
    ].join(" "),
  );

  if (/\b(etapa|ensino)\b/.test(label)) return "stage";
  if (/(ano serie|anoserie|serie|ano\/serie)/.test(label)) return "year";
  if (/(area|conhecimento|campo de experiencia|campo)/.test(label)) return "area";
  if (/(componente|curricular|disciplina)/.test(label)) return "component";
  if (/(trimestre)/.test(label)) return "trimester";
  if (/(tipo do material|tipo de material)/.test(label)) return "materialType";
  if (/(tipo|planejamento)/.test(label)) return "planningType";

  return null;
}

function enhanceSelect(field: HTMLSelectElement, options: string[]) {
  if (!options.length) return;

  const existing = Array.from(field.options).map((option) => option.textContent?.trim() || "");
  const hasUsefulOptions = existing.filter((item) => item && !/selecione/i.test(item)).length > 1;

  if (hasUsefulOptions) return;

  const current = field.value;

  field.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecione";
  field.appendChild(placeholder);

  for (const optionText of options) {
    const option = document.createElement("option");
    option.value = optionText;
    option.textContent = optionText;
    field.appendChild(option);
  }

  if (current && options.includes(current)) {
    field.value = current;
  }
}

function createMenu() {
  const existing = document.getElementById("planify-smart-field-menu");
  if (existing) return existing;

  const menu = document.createElement("div");
  menu.id = "planify-smart-field-menu";
  menu.className = "planify-smart-field-menu";
  document.body.appendChild(menu);

  return menu;
}

function hideMenu() {
  const menu = document.getElementById("planify-smart-field-menu");
  if (menu) {
    menu.classList.remove("is-open");
    menu.innerHTML = "";
  }
}

function openMenu(field: HTMLInputElement | HTMLTextAreaElement, kind: FieldKind) {
  const allOptions = getOptionsForKind(kind);
  const query = normalizeText(field.value || "");
  const options = allOptions.filter((item) => normalizeText(item).includes(query)).slice(0, 30);

  const menu = createMenu();
  const rect = field.getBoundingClientRect();

  menu.innerHTML = "";

  if (!options.length) {
    hideMenu();
    return;
  }

  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.className = "planify-smart-field-menu__option";
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      setNativeValue(field, option);
      hideMenu();

      window.setTimeout(() => refreshEnhancedFields(), 60);
    });

    menu.appendChild(button);
  }

  menu.style.left = `${rect.left + window.scrollX}px`;
  menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
  menu.style.width = `${Math.max(rect.width, 280)}px`;
  menu.classList.add("is-open");
}

function addDatalist(field: HTMLInputElement, kind: FieldKind) {
  const id = `planify-datalist-${kind}`;
  let datalist = document.getElementById(id) as HTMLDataListElement | null;

  if (!datalist) {
    datalist = document.createElement("datalist");
    datalist.id = id;
    document.body.appendChild(datalist);
  }

  const options = getOptionsForKind(kind);

  datalist.innerHTML = "";
  for (const option of options) {
    const node = document.createElement("option");
    node.value = option;
    datalist.appendChild(node);
  }

  field.setAttribute("list", id);
}

function refreshEnhancedFields() {
  const fields = getAllFields();

  for (const field of fields) {
    const kind = fieldKind(field);

    if (!kind) continue;

    const options = getOptionsForKind(kind);

    field.classList.add("planify-smart-field");

    if (field instanceof HTMLSelectElement) {
      enhanceSelect(field, options);
      continue;
    }

    if (field instanceof HTMLInputElement) {
      addDatalist(field, kind);
    }

    if (field.dataset.planifySmartEnhanced === "true") {
      continue;
    }

    field.dataset.planifySmartEnhanced = "true";

    field.addEventListener("focus", () => openMenu(field, kind));
    field.addEventListener("click", () => openMenu(field, kind));
    field.addEventListener("input", () => openMenu(field, kind));
    field.addEventListener("keydown", (event) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        hideMenu();
      }
    });
  }
}

function applyTextFixes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  for (const node of nodes) {
    const original = node.nodeValue || "";
    const fixed = fixText(original);

    if (fixed !== original) {
      node.nodeValue = fixed;
    }
  }

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("input, textarea, button, a, option, [title], [aria-label]"),
  );

  for (const element of elements) {
    for (const attr of ["placeholder", "title", "aria-label", "value"]) {
      const value = element.getAttribute(attr);
      if (!value) continue;

      const fixed = fixText(value);
      if (fixed !== value) {
        element.setAttribute(attr, fixed);
      }
    }
  }
}

function polishBibliotecaCards() {
  const currentPath = window.location.pathname;

  if (!currentPath.includes("biblioteca")) return;

  applyTextFixes();

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"));
  const hasMarketplaceLink = links.some((link) => link.getAttribute("href") === "/marketplace");

  if (!hasMarketplaceLink) {
    const candidate = links.find((link) => /biblioteca/i.test(link.textContent || ""));

    if (candidate?.parentElement) {
      const marketplace = candidate.cloneNode(true) as HTMLAnchorElement;
      marketplace.href = "/marketplace";
      marketplace.textContent = "Abrir Marketplace";
      marketplace.classList.add("planify-generated-marketplace-link");
      candidate.insertAdjacentElement("afterend", marketplace);
    }
  }
}

export function PlanifyFieldEnhancer() {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const run = () => {
      applyTextFixes();
      refreshEnhancedFields();
      polishBibliotecaCards();
    };

    run();

    const interval = window.setInterval(run, 900);

    observerRef.current = new MutationObserver(() => {
      window.requestAnimationFrame(run);
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target?.closest("#planify-smart-field-menu") && !target?.closest(".planify-smart-field")) {
        hideMenu();
      }
    };

    document.addEventListener("click", onDocumentClick);
    window.addEventListener("resize", hideMenu);
    window.addEventListener("scroll", hideMenu, true);

    return () => {
      window.clearInterval(interval);
      observerRef.current?.disconnect();
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("resize", hideMenu);
      window.removeEventListener("scroll", hideMenu, true);
      hideMenu();
    };
  }, []);

  return null;
}

export default PlanifyFieldEnhancer;
