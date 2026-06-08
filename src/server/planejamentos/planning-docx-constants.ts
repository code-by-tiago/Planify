export const CUSTOM_TEMPLATE_MAX_BYTES = 10 * 1024 * 1024;

export const CUSTOM_TEMPLATE_FALLBACK_MESSAGE =
  "Não foi possível mapear completamente este modelo. Usamos o modelo padrão do Planify para garantir o documento.";

export const CUSTOM_TEMPLATE_ALLOWED_EXTENSION = ".docx";

export const CUSTOM_TEMPLATE_ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
  "application/zip",
  "application/x-zip-compressed",
]);
