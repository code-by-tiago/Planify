export function getClosestTable(
  node: Node | null,
  editor: HTMLElement | null,
): HTMLTableElement | null {
  if (!node || !editor) {
    return null;
  }

  let current: Node | null =
    node.nodeType === Node.TEXT_NODE ? node.parentNode : node;

  while (current && current !== editor) {
    if (current instanceof HTMLTableElement) {
      return current;
    }

    current = current.parentNode;
  }

  return null;
}

export function getClosestTableCell(
  node: Node | null,
  editor: HTMLElement | null,
): HTMLTableCellElement | null {
  if (!node || !editor) {
    return null;
  }

  let current: Node | null =
    node.nodeType === Node.TEXT_NODE ? node.parentNode : node;

  while (current && current !== editor) {
    if (current instanceof HTMLTableCellElement) {
      return current;
    }

    current = current.parentNode;
  }

  return null;
}
