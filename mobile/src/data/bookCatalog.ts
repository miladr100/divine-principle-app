import raw from './principioDivino2014.json';
import footnoteLinks from './footnoteLinks.json';
import { BibleReference, BookNode, BookNodeType, EditorialColor, FootnoteLink, Paragraph, TextSegment } from '../types/book';

type RawNode = {
  id: string;
  parentId: string | null;
  type: string;
  number: string | null;
  title: string;
  order: number;
};

type RawReference = {
  original: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
};

type RawParagraph = {
  id: string;
  nodeId: string;
  order: number;
  text: string;
  searchText: string;
  segments: { text: string; editorialColor: string }[];
  bibleReferences: RawReference[];
  heading?: boolean;
};

const NODE_TYPES = new Set<BookNodeType>([
  'preface',
  'introduction',
  'part',
  'chapter',
  'section',
  'subsection'
]);

const COLORS = new Set<EditorialColor>(['red', 'blue', 'yellow', 'white']);

function asNodeType(value: string): BookNodeType {
  return NODE_TYPES.has(value as BookNodeType) ? (value as BookNodeType) : 'section';
}

function asColor(value: string): EditorialColor {
  return COLORS.has(value as EditorialColor) ? (value as EditorialColor) : 'white';
}

function dominantColor(segments: TextSegment[]): EditorialColor {
  const totals = new Map<EditorialColor, number>();
  for (const segment of segments) {
    totals.set(segment.editorialColor, (totals.get(segment.editorialColor) ?? 0) + segment.text.length);
  }
  let best: EditorialColor = 'white';
  let bestCount = -1;
  for (const [color, count] of totals) {
    if (count > bestCount) {
      best = color;
      bestCount = count;
    }
  }
  return best;
}

function referenceText(ref: RawReference) {
  const verses = ref.verseEnd !== ref.verseStart ? `${ref.verseStart}-${ref.verseEnd}` : String(ref.verseStart);
  return `${ref.book} ${ref.chapter}:${verses}`;
}

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const LOWER_START = /^[a-zà-ÿáéíóúâêôãõçü]/;
const NUMBERED_HEADING = /^\d+(?:\.\d+){1,4}\.?\s+\S/;
const SENTENCE_END = /[.!?…]["”»')\]]?$/;
const LINE_HYPHEN = /[A-Za-zÀ-ÿáéíóúâêôãõçü]-$/;

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function toSuperscript(value: string) {
  return [...value].map((digit) => SUPERSCRIPTS[Number(digit)] ?? digit).join('');
}

function cleanSegmentText(value: string) {
  return value
    .replace(/\u00AD/g, '')
    .replace(/(\d+)a edição/g, '$1ª edição')
    .replace(/([a-zà-ÿ0-9])\.([A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1. $2')
    .replace(/([A-Za-zÀ-ÿÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõçü"”»')\]])(\d{1,3})(?=[\s.,;:!?)\]»”"'“«—–-]|$)/g, (_, mark: string, note: string) => `${mark}${toSuperscript(note)}`);
}

function refreshParagraph(paragraph: Paragraph) {
  paragraph.text = paragraph.segments.map((segment) => segment.text).join('').replace(/[ \t]{2,}/g, ' ').trim();
  paragraph.searchText = normalizeSearch(paragraph.text);
  paragraph.editorialColor = dominantColor(paragraph.segments);
  paragraph.role = paragraph.role === 'heading' || isSubheading(paragraph.text) ? 'heading' : undefined;
}

function isSubheading(text: string) {
  const value = text.trim();
  return value.length > 0 && value.length < 160 && NUMBERED_HEADING.test(value);
}

const BIBLE_CITE = /—\s*(?:[1-3]\s+|I{1,3}\s+|IV\s+)?[\p{Lu}][\p{L}.]*\s*\d+\s*:\s*\d[\d\s,.:–-]*?(?:\s+e\s+\d+)?(?:\s+cf\.\s+[\p{L}.]+\s*\d+\s*:\s*\d+(?:-\d+)?)?\.?\s*$/u;

export function trailingBibleCitation(text: string) {
  const value = text.trim();
  const match = value.match(BIBLE_CITE);
  if (!match || match.index === undefined || match.index <= 0) return null;
  return { quote: value.slice(0, match.index).trimEnd(), cite: match[0].trim() };
}

function isStandaloneBibleCitation(text: string) {
  const value = text.trim();
  const match = value.match(BIBLE_CITE);
  return !!match && match.index === 0;
}

function normalizeParagraph(paragraph: Paragraph) {
  paragraph.segments = paragraph.segments.map((segment) => ({
    ...segment,
    text: cleanSegmentText(segment.text)
  }));
  refreshParagraph(paragraph);
  return paragraph;
}

function mergeMode(current: Paragraph, next: Paragraph): 'hyphen' | 'space' | null {
  const currentText = current.text.trimEnd();
  const nextText = next.text.trimStart();
  if (!nextText || current.role === 'heading' || next.role === 'heading' || isSubheading(currentText) || isSubheading(nextText)) return null;
  if (!LOWER_START.test(nextText)) return null;
  if (LINE_HYPHEN.test(currentText)) return 'hyphen';
  if (SENTENCE_END.test(currentText)) return null;
  if (nextText.length <= 12 && !nextText.includes(' ')) return null;
  if (current.sectionId !== next.sectionId && nextText.length < 90 && !/[.!?…]/.test(nextText)) return null;
  return 'space';
}

function joinParagraphs(target: Paragraph, extra: Paragraph, mode: 'hyphen' | 'space') {
  const segments = target.segments.map((segment) => ({ ...segment }));
  const incoming = extra.segments.map((segment) => ({ ...segment }));
  if (!segments.length) segments.push({ text: '', editorialColor: 'white' });
  if (!incoming.length) incoming.push({ text: extra.text, editorialColor: extra.editorialColor });

  if (mode === 'hyphen') {
    segments[segments.length - 1].text = segments[segments.length - 1].text.replace(/-\s*$/, '');
    incoming[0].text = incoming[0].text.replace(/^\s+/, '');
  } else if (!/\s$/.test(segments[segments.length - 1].text) && !/^\s/.test(incoming[0].text)) {
    segments[segments.length - 1].text += ' ';
  }

  for (const segment of incoming) {
    const last = segments[segments.length - 1];
    if (last.editorialColor === segment.editorialColor) last.text += segment.text;
    else segments.push(segment);
  }

  target.segments = segments;
  target.bibleRefs = [...(target.bibleRefs ?? []), ...(extra.bibleRefs ?? [])];
  target.footnotes = [...(target.footnotes ?? []), ...(extra.footnotes ?? [])];
  refreshParagraph(target);
}

function isOrphanSyllable(paragraph: Paragraph) {
  const text = paragraph.text.trim();
  return text.length > 0 && text.length <= 12 && !text.includes(' ') && !/[.!?0-9]/.test(text) && LOWER_START.test(text);
}

function isWrappedHeading(paragraph: Paragraph) {
  const text = paragraph.text.trim().replace(/\?$/, '').trim();
  if (paragraph.role === 'heading' || text.length < 8 || text.length > 80 || /[.!?]/.test(text)) return false;
  if (!LOWER_START.test(text)) return false;
  return (text.match(/\p{Lu}[\p{Ll}'’]+/gu) ?? []).length >= 2;
}

function capitalizeSentenceStart(paragraph: Paragraph) {
  if (paragraph.role === 'heading' || !LOWER_START.test(paragraph.text)) return;
  if (paragraph.text.length < 80 && !/[.!?…]/.test(paragraph.text)) return;
  const segment = paragraph.segments[0];
  if (!segment) return;
  const leading = segment.text.length - segment.text.trimStart().length;
  const word = segment.text.slice(leading);
  if (!LOWER_START.test(word)) return;
  segment.text = `${segment.text.slice(0, leading)}${word[0].toUpperCase()}${word.slice(1)}`;
  refreshParagraph(paragraph);
}

function isStrayTitle(paragraph: Paragraph, node: BookNode, byId: Map<string, BookNode>) {
  if (paragraph.role === 'heading') return false;
  const bare = paragraph.text.trim().replace(/\.$/, '').trim().toLowerCase();
  if (bare.length < 8 || bare.length > 90) return false;
  if (/[.!?]/.test(bare)) return false;
  let current: BookNode | undefined = node;
  while (current) {
    const title = current.title.trim().toLowerCase();
    if (title === bare || (bare.length >= 12 && title.endsWith(bare) && title.length > bare.length)) return true;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}

function repairParagraphs(ordered: Paragraph[], byId: Map<string, BookNode>) {
  let index = 0;
  while (index < ordered.length - 1) {
    const current = ordered[index];
    const next = ordered[index + 1];
    const currentNode = byId.get(current.sectionId);
    const nextNode = byId.get(next.sectionId);
    if ((currentNode && isStrayTitle(current, currentNode, byId)) || (nextNode && isStrayTitle(next, nextNode, byId))) {
      index += 1;
      continue;
    }
    const citation = isStandaloneBibleCitation(next.text) && current.sectionId === next.sectionId && current.role !== 'heading';
    const mode = citation ? 'space' : mergeMode(current, next);
    if (!mode) {
      index += 1;
      continue;
    }
    const removed = ordered[index + 1];
    joinParagraphs(ordered[index], removed, mode);
    ordered.splice(index + 1, 1);
    const node = byId.get(removed.sectionId);
    if (node) node.paragraphs = node.paragraphs.filter((paragraph) => paragraph.id !== removed.id);
  }

  const unfinishedLabels = new Map<string, string>([
    ['Desenvol-', 'Desenvolvimento'],
    ['Aperfei-', 'Aperfeiçoamento']
  ]);
  for (const node of byId.values()) {
    for (const paragraph of node.paragraphs) {
      const completed = unfinishedLabels.get(paragraph.text.trim());
      if (!completed || !paragraph.segments[0]) continue;
      paragraph.segments = [{ ...paragraph.segments[0], text: completed }];
      refreshParagraph(paragraph);
    }
    node.paragraphs = node.paragraphs.filter((paragraph) => !isStrayTitle(paragraph, node, byId) && !isWrappedHeading(paragraph) && !isOrphanSyllable(paragraph));
    node.paragraphs.forEach(capitalizeSentenceStart);
  }
}

function footnoteLinksFor(paragraphId: string): FootnoteLink[] {
  const notes = (footnoteLinks as Record<string, { n: number; text: string }[]>)[paragraphId] ?? [];
  return notes.map((note) => ({ number: note.n, text: note.text }));
}

function toParagraph(rawParagraph: RawParagraph): Paragraph {
  const segments: TextSegment[] = (rawParagraph.segments.length ? rawParagraph.segments : [{ text: rawParagraph.text, editorialColor: 'white' }])
    .map((segment) => ({ text: segment.text, editorialColor: asColor(segment.editorialColor) }));
  const bibleRefs: BibleReference[] = rawParagraph.bibleReferences.map((ref, index) => ({
    id: `${rawParagraph.id}-ref${index + 1}`,
    label: ref.original,
    text: referenceText(ref)
  }));
  return {
    id: rawParagraph.id,
    sectionId: rawParagraph.nodeId,
    order: rawParagraph.order,
    text: rawParagraph.text,
    searchText: rawParagraph.searchText,
    editorialColor: dominantColor(segments),
    segments,
    bibleRefs,
    footnotes: footnoteLinksFor(rawParagraph.id),
    role: rawParagraph.heading ? 'heading' : undefined
  };
}

function buildTree() {
  const sourceNodes = raw.nodes as RawNode[];
  const byId = new Map<string, BookNode>();
  for (const source of sourceNodes) {
    byId.set(source.id, {
      id: source.id,
      parentId: source.parentId,
      type: asNodeType(source.type),
      number: source.number,
      title: source.title,
      order: source.order,
      children: [],
      paragraphs: []
    });
  }

  const ordered: Paragraph[] = [];
  for (const source of raw.paragraphs as RawParagraph[]) {
    const node = byId.get(source.nodeId);
    if (!node) continue;
    const paragraph = normalizeParagraph(toParagraph(source));
    node.paragraphs.push(paragraph);
    ordered.push(paragraph);
  }
  repairParagraphs(ordered, byId);

  const roots: BookNode[] = [];
  for (const source of sourceNodes) {
    const node = byId.get(source.id);
    if (!node) continue;
    const parent = source.parentId ? byId.get(source.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sortNodes = (nodes: BookNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);
  return { roots, byId };
}

const catalog = buildTree();

export const BOOK_ROOTS = catalog.roots;

export function getBookNode(id: string) {
  return catalog.byId.get(id);
}

export function getBreadcrumb(id: string): BookNode[] {
  const path: BookNode[] = [];
  let current = catalog.byId.get(id);
  while (current) {
    path.unshift(current);
    current = current.parentId ? catalog.byId.get(current.parentId) : undefined;
  }
  return path;
}

function walk(nodes: BookNode[], visit: (node: BookNode) => void) {
  for (const node of nodes) {
    visit(node);
    walk(node.children, visit);
  }
}

export function readableNodes(): BookNode[] {
  const nodes: BookNode[] = [];
  walk(BOOK_ROOTS, (node) => {
    if (node.paragraphs.length > 0) nodes.push(node);
  });
  return nodes;
}

export function firstReadable(node: BookNode): BookNode | undefined {
  if (node.paragraphs.length > 0) return node;
  for (const child of node.children) {
    const found = firstReadable(child);
    if (found) return found;
  }
  return undefined;
}

export function getNextReadable(id: string) {
  const nodes = readableNodes();
  const index = nodes.findIndex((node) => node.id === id);
  return index >= 0 ? nodes[index + 1] : undefined;
}

export function getPreviousReadable(id: string) {
  const nodes = readableNodes();
  const index = nodes.findIndex((node) => node.id === id);
  return index > 0 ? nodes[index - 1] : undefined;
}

export function getPreviousReadableSibling(id: string) {
  const node = catalog.byId.get(id);
  if (!node) return undefined;
  const siblings = node.parentId
    ? catalog.byId.get(node.parentId)?.children ?? []
    : BOOK_ROOTS;
  const readable = siblings.filter((item) => item.paragraphs.length > 0);
  const index = readable.findIndex((item) => item.id === id);
  return index > 0 ? readable[index - 1] : undefined;
}

export function nodeLabel(node: BookNode) {
  if (node.type === 'chapter' && node.number) return `Capítulo ${node.number} — ${node.title}`;
  if (node.type === 'section' && node.number) return `Seção ${node.number} — ${node.title}`;
  if (node.type === 'subsection' && node.number) return `${node.number} ${node.title}`;
  return node.title;
}

export function nodeEyebrow(node: BookNode) {
  if (node.type === 'preface') return 'Prefácio';
  if (node.type === 'introduction') return 'Introdução';
  if (node.type === 'part') return node.title;
  if (node.type === 'chapter') return `Capítulo ${node.number ?? ''}`.trim();
  if (node.type === 'section') return `Seção ${node.number ?? ''}`.trim();
  if (node.type === 'subsection') return node.number ?? 'Subseção';
  return node.title;
}
