import source from '../../principio-divino-365-reflexoes.json';
import { BOOK_ROOTS } from './bookCatalog';
import { BookNode } from '../types/book';

export type DailyReflection = {
  dia: number;
  pagina: number;
  capitulo: string;
  secao: string;
  trecho: string;
  reflexao: string;
  sectionId?: string;
};

type RawReflection = Omit<DailyReflection, 'sectionId'>;

const reflections = (source.volumes as { reflexoes: RawReflection[] }[]).flatMap((volume) => volume.reflexoes);
const byDay = new Map(reflections.map((item) => [item.dia, item]));

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function allParagraphs() {
  const list: { sectionId: string; text: string }[] = [];
  const visit = (node: BookNode) => {
    for (const paragraph of node.paragraphs) {
      list.push({ sectionId: node.id, text: paragraph.searchText || normalize(paragraph.text) });
    }
    node.children.forEach(visit);
  };
  BOOK_ROOTS.forEach(visit);
  return list;
}

let paragraphIndex: { sectionId: string; text: string }[] | null = null;

function findSection(trecho: string) {
  const text = normalize(trecho);
  if (text.length < 24) return undefined;
  if (!paragraphIndex) paragraphIndex = allParagraphs();
  for (let start = 0; start < text.length; start += 18) {
    const slice = text.slice(start, start + 52);
    if (slice.length < 28) break;
    const found = paragraphIndex.find((paragraph) => paragraph.text.includes(slice));
    if (found) return found.sectionId;
  }
}

export function reflectionForDay(day: number): DailyReflection {
  const item = byDay.get(day) ?? reflections[Math.min(Math.max(day, 1), reflections.length) - 1];
  return { ...item, sectionId: findSection(item.trecho) };
}

export function reflectionForDate(date = new Date()): DailyReflection {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const day = Math.min(365, Math.floor((current - start) / 86400000) + 1);
  return reflectionForDay(day);
}
