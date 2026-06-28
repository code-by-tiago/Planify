export function cloneEditorRange(editor: HTMLElement): Range | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!editor.contains(range.commonAncestorContainer)) {
    return null;
  }

  return range.cloneRange();
}

export function applyEditorRange(range: Range | null) {
  const selection = window.getSelection();

  if (!range || !selection) {
    return;
  }

  selection.removeAllRanges();
  selection.addRange(range);
}

export function preventToolbarFocusLoss(event: React.MouseEvent) {
  event.preventDefault();
}
