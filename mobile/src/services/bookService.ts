import { BOOK_ROOTS, firstReadable, getBookNode, getBreadcrumb, getNextReadable, getPreviousReadable, getPreviousReadableSibling, nodeLabel } from '../data/bookCatalog';
import { BookNode, Paragraph } from '../types/book';

export function getSection(sectionId: string) {
  const node = getBookNode(sectionId);
  return node ? firstReadable(node) ?? node : undefined;
}

export function getNextSection(sectionId: string) {
  return getNextReadable(sectionId);
}

export function getPreviousSection(sectionId: string) {
  return getPreviousReadableSibling(sectionId);
}

export function getPreviousReadableSection(sectionId: string) {
  return getPreviousReadable(sectionId);
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export type SearchHit = {
  node: BookNode;
  paragraph: Paragraph;
  title: string;
  meta: string;
};

export function searchBook(query: string): SearchHit[] {
  const term = normalizeSearch(query);
  if (term.length < 2) return [];
  const hits: SearchHit[] = [];
  const visit = (node: BookNode) => {
    for (const paragraph of node.paragraphs) {
      if (!paragraph.searchText.includes(term) && !normalizeSearch(paragraph.text).includes(term)) continue;
      const path = getBreadcrumb(node.id);
      const chapter = [...path].reverse().find((item) => item.type === 'chapter' || item.type === 'part' || item.type === 'preface' || item.type === 'introduction');
      hits.push({
        node,
        paragraph,
        title: chapter ? nodeLabel(chapter) : node.title,
        meta: nodeLabel(node)
      });
      if (hits.length >= 60) return;
    }
    for (const child of node.children) {
      if (hits.length >= 60) return;
      visit(child);
    }
  };
  for (const root of BOOK_ROOTS) {
    if (hits.length >= 60) break;
    visit(root);
  }
  return hits;
}
