"use client";

import { useEffect, useRef } from "react";

type StageConfig = {
  years: string[];
  areas: string[];
  componentsByArea: Record<string, string[]>;
};

type FieldKind = "stage" | "year" | "area" | "component" | "planningType" | "trimester" | "materialType";

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
    years: ["1\u00ba ano", "2\u00ba ano", "3\u00ba ano", "4\u00ba ano", "5\u00ba ano", "6\u00ba ano", "7\u00ba ano", "8\u00ba ano", "9\u00ba ano"],
    areas: [AREA_LINGUAGENS_FUND, AREA_MATEMATICA_FUND, AREA_CIENCIAS_NATUREZA_FUND, AREA_CIENCIAS_HUMANAS_FUND, AREA_ENSINO_RELIGIOSO],
    componentsByArea: {
      [AREA_LINGUAGENS_FUND]: ["L\u00edngua Portuguesa", "Arte", "Educa\u00e7\u00e3o F\u00edsica", "L\u00edngua Inglesa"],
      [AREA_MATEMATICA_FUND]: ["Matem\u00e1tica"],
      [AREA_CIENCIAS_NATUREZA_FUND]: ["Ci\u00eancias"],
      [AREA_CIENCIAS_HUMANAS_FUND]: ["Hist\u00f3ria", "Geografia"],
      [AREA_ENSINO_RELIGIOSO]: ["Ensino Religioso"],
    },
  },
  [STAGE_MEDIO]: {
    years: ["1\u00aa s\u00e9rie", "2\u00aa s\u00e9rie", "3\u00aa s\u00e9rie"],
    areas: [AREA_LINGUAGENS_MEDIO, AREA_MATEMATICA_MEDIO, AREA_CIENCIAS_NATUREZA_MEDIO, AREA_CIENCIAS_HUMANAS_MEDIO],
    componentsByArea: {
      [AREA_LINGUAGENS_MEDIO]: ["L\u00edngua Portuguesa", "Arte", "Educa\u00e7\u00e3o F\u00edsica", "L\u00edngua Inglesa", "L\u00edngua Espanhola"],
      [AREA_MATEMATICA_MEDIO]: ["Matem\u00e1tica"],
      [AREA_CIENCIAS_NATUREZA_MEDIO]: ["Biologia", "F\u00edsica", "Qu\u00edmica"],
      [AREA_CIENCIAS_HUMANAS_MEDIO]: ["Hist\u00f3ria", "Geografia", "Filosofia", "Sociologia"],
    },
  },
};

const MATERIAL_TYPES = ["Atividade", "Avalia\u00e7\u00e3o", "Apostila", "Sequ\u00eancia did\u00e1tica", "Projeto", "Roteiro de aula", "Jogo pedag\u00f3gico", "Din\u00e2mica", "Resumo", "Lista de exerc\u00edcios"];
const PLANNING_TYPES = ["Anual", "Trimestral", "Anual + trimestral"];
const TRIMESTERS = ["1\u00ba trimestre", "2\u00ba trimestre", "3\u00ba trimestre"];

const FIELD_LABEL_MAX_LENGTH = 90;
const BNCC_MAX_PER_CONTENT = 3;
const BNCC_FALLBACK_MAX = 12;
const BNCC_ABSOLUTE_MAX = 18;

function decodeLiteralUnicode(value: string) {
  return value.replace(/\\u\{([0-9a-fA-F]+)\}/g, (match, hex) => {
    const codePoint = Number.parseInt(hex, 16);
    if (!Number.isFinite(codePoint)) return match;
    try { return String.fromCodePoint(codePoint); } catch { return match; }
  }).replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    const codePoint = Number.parseInt(hex, 16);
    if (!Number.isFinite(codePoint)) return match;
    return String.fromCharCode(codePoint);
  });
}

function fixText(value: string) {
  return decodeLiteralUnicode(value)
    .replace(/\u00c3\u00a1/g, "\u00e1").replace(/\u00c3\u00a0/g, "\u00e0").replace(/\u00c3\u00a2/g, "\u00e2").replace(/\u00c3\u00a3/g, "\u00e3")
    .replace(/\u00c3\u00a7/g, "\u00e7").replace(/\u00c3\u00a9/g, "\u00e9").replace(/\u00c3\u00aa/g, "\u00ea").replace(/\u00c3\u00ad/g, "\u00ed")
    .replace(/\u00c3\u00b3/g, "\u00f3").replace(/\u00c3\u00b4/g, "\u00f4").replace(/\u00c3\u00b5/g, "\u00f5").replace(/\u00c3\u00ba/g, "\u00fa")
    .replace(/\u00c2\u00ba/g, "\u00ba").replace(/\u00c2\u00aa/g, "\u00aa").replace(/\u00c2/g, "");
}

function normalizeText(value: string) {
  return fixText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s/+-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function isUsableLabel(value: string | null | undefined) {
  const text = (value || "").trim();
  if (!text) return false;
  if (text.length > FIELD_LABEL_MAX_LENGTH) return false;
  if (text.split(/\s+/).length > 8) return false;
  return true;
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  if (descriptor?.set) descriptor.set.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function safeLabelSelector(id: string) {
  return id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getFieldLabel(field: HTMLElement) {
  const aria = field.getAttribute("aria-label");
  if (isUsableLabel(aria)) return aria || "";

  const id = field.getAttribute("id");
  if (id) {
    const direct = document.querySelector(`label[for="${safeLabelSelector(id)}"]`);
    if (isUsableLabel(direct?.textContent)) return direct?.textContent || "";
  }

  const labelParent = field.closest("label");
  if (isUsableLabel(labelParent?.textContent)) return labelParent?.textContent || "";

  let previous = field.previousElementSibling;
  while (previous) {
    if (isUsableLabel(previous.textContent)) return previous.textContent || "";
    previous = previous.previousElementSibling;
  }

  const parent = field.parentElement;
  const parentLabels = Array.from(parent?.querySelectorAll("label, span, strong, p") || []);
  for (const item of parentLabels) {
    if (item.contains(field)) continue;
    if (isUsableLabel(item.textContent)) return item.textContent || "";
  }

  const grandParent = parent?.parentElement;
  const grandParentLabels = Array.from(grandParent?.querySelectorAll(":scope > label, :scope > span, :scope > strong, :scope > p") || []);
  for (const item of grandParentLabels) {
    if (isUsableLabel(item.textContent)) return item.textContent || "";
  }

  return field.getAttribute("placeholder") || field.getAttribute("name") || "";
}

function getFieldSearchText(field: HTMLElement) {
  return normalizeText([getFieldLabel(field), field.getAttribute("name") || "", field.getAttribute("id") || "", field.getAttribute("placeholder") || ""].join(" "));
}

function getAllFields() {
  return Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input:not([type="hidden"]):not([type="file"]), textarea, select'));
}

function fieldKind(field: HTMLElement): FieldKind | null {
  if (field instanceof HTMLTextAreaElement) return null;
  const label = getFieldSearchText(field);
  if (/\b(etapa|ensino)\b/.test(label)) return "stage";
  if (/(ano serie|anoserie|serie|ano\/serie)/.test(label)) return "year";
  if (/(area|conhecimento|campo de experiencia|campo)/.test(label)) return "area";
  if (/(componente curricular|componente|disciplina|curricular)/.test(label)) return "component";
  if (/(trimestre)/.test(label)) return "trimester";
  if (/(tipo do material|tipo de material)/.test(label)) return "materialType";
  if (/(tipo de planejamento|tipo planejamento|tipo$| planejamento$)/.test(label)) return "planningType";
  return null;
}

function findFieldByKind(kind: FieldKind) {
  return getAllFields().find((field) => fieldKind(field) === kind) || null;
}

function getStageValue() {
  const value = fixText(findFieldByKind("stage")?.value || "");
  if (/infantil/i.test(value)) return STAGE_INFANTIL;
  if (/medio|m[e\u00e9]dio/i.test(value)) return STAGE_MEDIO;
  return STAGE_FUNDAMENTAL;
}

function getAreaValue() {
  const raw = fixText(findFieldByKind("area")?.value || "");
  const stage = getStageValue();
  const config = EDUCATION_DATA[stage] || EDUCATION_DATA[STAGE_FUNDAMENTAL];
  if (config.areas.includes(raw)) return raw;
  const normalized = normalizeText(raw);
  if (stage === STAGE_MEDIO && normalized === "linguagens") return AREA_LINGUAGENS_MEDIO;
  if (stage === STAGE_MEDIO && normalized === "matematica") return AREA_MATEMATICA_MEDIO;
  if (stage === STAGE_MEDIO && normalized === "ciencias da natureza") return AREA_CIENCIAS_NATUREZA_MEDIO;
  if (stage === STAGE_MEDIO && normalized === "ciencias humanas") return AREA_CIENCIAS_HUMANAS_MEDIO;
  return raw;
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

function enhanceSelect(field: HTMLSelectElement, kind: FieldKind) {
  const options = getOptionsForKind(kind);
  if (!options.length) return;
  const current = fixText(field.value || "");
  const nextValue = current && options.includes(current) ? current : "";
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
  if (nextValue) field.value = nextValue;
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

function openMenu(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, kind: FieldKind, shouldFilter: boolean) {
  const allOptions = getOptionsForKind(kind);
  const query = normalizeText(field.value || "");
  const options = shouldFilter && query ? allOptions.filter((item) => normalizeText(item).includes(query)).slice(0, 40) : allOptions.slice(0, 40);
  const menu = createMenu();
  const rect = field.getBoundingClientRect();
  menu.innerHTML = "";
  if (!options.length) { hideMenu(); return; }
  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.className = "planify-smart-field-menu__option";
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      setNativeValue(field, option);
      hideMenu();
      window.setTimeout(() => { enforceCompatibility(kind); refreshEnhancedFields(); }, 40);
    });
    menu.appendChild(button);
  }
  menu.style.left = `${rect.left + window.scrollX}px`;
  menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
  menu.style.width = `${Math.max(rect.width, 300)}px`;
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
  datalist.innerHTML = "";
  for (const option of getOptionsForKind(kind)) {
    const node = document.createElement("option");
    node.value = option;
    datalist.appendChild(node);
  }
  field.setAttribute("list", id);
}

function enforceCompatibility(triggerKind?: FieldKind) {
  const stage = getStageValue();
  const config = EDUCATION_DATA[stage] || EDUCATION_DATA[STAGE_FUNDAMENTAL];
  const yearField = findFieldByKind("year");
  const areaField = findFieldByKind("area");
  const componentField = findFieldByKind("component");
  if (yearField && yearField.value && !config.years.includes(fixText(yearField.value))) setNativeValue(yearField, "");
  if (areaField) {
    const currentArea = getAreaValue();
    if (currentArea && currentArea !== areaField.value && config.areas.includes(currentArea)) setNativeValue(areaField, currentArea);
    if (areaField.value && !config.areas.includes(fixText(areaField.value))) setNativeValue(areaField, config.areas[0] || "");
    if (triggerKind === "stage" && !areaField.value && config.areas[0]) setNativeValue(areaField, config.areas[0]);
  }
  const componentOptions = getOptionsForKind("component");
  if (componentField && componentField.value && !componentOptions.includes(fixText(componentField.value))) setNativeValue(componentField, "");
  if ((triggerKind === "stage" || triggerKind === "area") && componentField) setNativeValue(componentField, "");
}

function refreshEnhancedFields() {
  const fields = getAllFields();
  for (const field of fields) {
    const kind = fieldKind(field);
    if (!kind) { field.classList.remove("planify-smart-field"); continue; }
    field.classList.add("planify-smart-field");
    if (field instanceof HTMLSelectElement) enhanceSelect(field, kind);
    if (field instanceof HTMLInputElement) addDatalist(field, kind);
    if (field.dataset.planifySmartEnhanced === "true") continue;
    field.dataset.planifySmartEnhanced = "true";
    field.addEventListener("focus", () => openMenu(field, kind, false));
    field.addEventListener("click", () => openMenu(field, kind, false));
    field.addEventListener("input", () => {
      openMenu(field, kind, true);
      window.setTimeout(() => { if (kind === "stage" || kind === "area") enforceCompatibility(kind); refreshEnhancedFields(); }, 80);
    });
    field.addEventListener("change", () => {
      if (kind === "stage" || kind === "area") { enforceCompatibility(kind); refreshEnhancedFields(); }
    });
    field.addEventListener("keydown", (event) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") hideMenu();
    });
  }
  enforceCompatibility();
}

function applyTextFixes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const original = node.nodeValue || "";
    const fixed = fixText(original);
    if (fixed !== original) node.nodeValue = fixed;
  }
  const elements = Array.from(document.querySelectorAll<HTMLElement>("input, textarea, button, a, option, [title], [aria-label]"));
  for (const element of elements) {
    for (const attr of ["placeholder", "title", "aria-label", "value"]) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      const fixed = fixText(value);
      if (fixed !== value) element.setAttribute(attr, fixed);
    }
  }
}

function getContentLineCount() {
  const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea"));
  const contentTextarea = textareas.find((field) => {
    const label = getFieldSearchText(field);
    const placeholder = normalizeText(field.getAttribute("placeholder") || "");
    return label.includes("conteudos") || placeholder.includes("conteudo por linha");
  });
  if (!contentTextarea?.value.trim()) return 0;
  return contentTextarea.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length;
}

function getSkillCode(text: string) {
  const match = fixText(text).match(/\b(?:EF\d{2}[A-Z]{2}\d{2}|EM13[A-Z]{2,4}\d{2,3}|EI\d{2}[A-Z]{2}\d{2})\b/);
  return match?.[0] || "";
}

function getSkillCard(element: HTMLElement) {
  return element.closest<HTMLElement>("[data-bncc-card]") || element.closest<HTMLElement>("article") || element.closest<HTMLElement>("li") || element.closest<HTMLElement>("button") || element.closest<HTMLElement>('[role="button"]') || element.closest<HTMLElement>("div");
}

function restoreElementDisplay(element: HTMLElement) {
  if (element.dataset.planifyHiddenSkill !== "true") return;
  element.style.display = element.dataset.planifyOriginalDisplay || "";
  element.dataset.planifyHiddenSkill = "false";
}

function hideElementDisplay(element: HTMLElement) {
  if (element.dataset.planifyHiddenSkill !== "true") element.dataset.planifyOriginalDisplay = element.style.display || "";
  element.dataset.planifyHiddenSkill = "true";
  element.style.display = "none";
}

function addBnccFilterNotice(parent: HTMLElement, visibleCount: number, hiddenCount: number) {
  let notice = parent.querySelector<HTMLElement>("[data-planify-bncc-filter-notice='true']");
  if (hiddenCount <= 0) { notice?.remove(); return; }
  if (!notice) {
    notice = document.createElement("div");
    notice.dataset.planifyBnccFilterNotice = "true";
    notice.className = "planify-bncc-filter-notice";
    parent.insertAdjacentElement("afterbegin", notice);
  }
  notice.textContent = `Sugest\u00f5es refinadas: ${visibleCount} habilidades exibidas, sem repeti\u00e7\u00f5es e com limite pedag\u00f3gico por conte\u00fado.`;
}

function filterBnccSuggestionCards() {
  if (!window.location.pathname.includes("planejamentos")) return;
  const allElements = Array.from(document.querySelectorAll<HTMLElement>("article, li, button, div, section"));
  const candidateCards: HTMLElement[] = [];
  for (const element of allElements) {
    const text = element.textContent || "";
    const code = getSkillCode(text);
    if (!code) continue;
    if (text.length > 1800) continue;
    const childHasCode = Array.from(element.children).some((child) => getSkillCode(child.textContent || ""));
    if (childHasCode) continue;
    const card = getSkillCard(element);
    if (!card) continue;
    if (card.textContent && card.textContent.length > 2200) continue;
    if (!candidateCards.includes(card)) candidateCards.push(card);
  }
  if (candidateCards.length <= 0) return;
  const contentCount = getContentLineCount();
  const maxVisible = contentCount > 0 ? Math.min(Math.max(contentCount * BNCC_MAX_PER_CONTENT, BNCC_MAX_PER_CONTENT), BNCC_ABSOLUTE_MAX) : BNCC_FALLBACK_MAX;
  const seenCodes = new Set<string>();
  let visible = 0;
  let hidden = 0;
  for (const card of candidateCards) {
    const code = getSkillCode(card.textContent || "");
    if (!code || seenCodes.has(code) || visible >= maxVisible) { hideElementDisplay(card); hidden += 1; continue; }
    seenCodes.add(code);
    restoreElementDisplay(card);
    visible += 1;
  }
  const parent = candidateCards[0]?.parentElement;
  if (parent) addBnccFilterNotice(parent, visible, hidden);
}

function polishBibliotecaCards() {
  if (!window.location.pathname.includes("biblioteca")) return;
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
    const run = () => { applyTextFixes(); refreshEnhancedFields(); filterBnccSuggestionCards(); polishBibliotecaCards(); };
    run();
    const interval = window.setInterval(run, 1000);
    observerRef.current = new MutationObserver(() => { window.requestAnimationFrame(run); });
    observerRef.current.observe(document.body, { childList: true, subtree: true, characterData: true });
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("#planify-smart-field-menu") && !target?.closest(".planify-smart-field")) hideMenu();
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
