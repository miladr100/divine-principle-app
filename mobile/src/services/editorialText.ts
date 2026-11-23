import { EditorialColor, Paragraph } from '../types/book';
import { ReadingDepth } from '../state/useSettingsStore';

const allowedByDepth: Record<ReadingDepth, EditorialColor[]> = {
  red: ['red'],
  blue: ['red', 'blue'],
  yellow: ['red', 'blue', 'yellow'],
  full: ['red', 'blue', 'yellow', 'white']
};

export function visibleSegments(paragraph: Paragraph, depth: ReadingDepth) {
  const allowed = new Set(allowedByDepth[depth]);
  return paragraph.segments.filter((segment) => allowed.has(segment.editorialColor) && segment.text.trim().length > 0);
}

export function visibleParagraphText(paragraph: Paragraph, depth: ReadingDepth) {
  return visibleSegments(paragraph, depth)
    .map((segment) => segment.text)
    .join('')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}
