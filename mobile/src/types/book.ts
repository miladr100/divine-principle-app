export type EditorialColor = 'red' | 'blue' | 'yellow' | 'white';

export type BookNodeType =
  | 'preface'
  | 'introduction'
  | 'part'
  | 'chapter'
  | 'section'
  | 'subsection';

export interface TextSegment {
  text: string;
  editorialColor: EditorialColor;
}

export interface BibleReference {
  id: string;
  label: string;
  text: string;
}

export interface FootnoteLink {
  number: number;
  text: string;
}

export interface Paragraph {
  id: string;
  sectionId: string;
  order: number;
  text: string;
  searchText: string;
  editorialColor: EditorialColor;
  segments: TextSegment[];
  bibleRefs?: BibleReference[];
  footnotes?: FootnoteLink[];
  role?: 'heading';
}

export interface BookNode {
  id: string;
  parentId: string | null;
  type: BookNodeType;
  number: string | null;
  title: string;
  order: number;
  children: BookNode[];
  paragraphs: Paragraph[];
}
