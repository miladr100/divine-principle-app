import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('principio-divino.db');
  return dbPromise;
}

export async function initializeDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id TEXT UNIQUE NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      last_paragraph_id TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY NOT NULL,
      section_id TEXT NOT NULL,
      paragraph_id TEXT NOT NULL,
      selected_text TEXT NOT NULL,
      start_offset INTEGER,
      end_offset INTEGER,
      color TEXT NOT NULL DEFAULT '#ff72b6',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      highlight_id TEXT,
      section_id TEXT NOT NULL,
      paragraph_id TEXT NOT NULL,
      selected_text TEXT,
      note_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY NOT NULL,
      section_id TEXT NOT NULL,
      paragraph_id TEXT NOT NULL,
      selected_text TEXT NOT NULL,
      categories_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT UNIQUE NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0
    );
  `);

  const defaults = ['Fé', 'Família', 'Queda', 'Restauração', 'Missão', 'Bênção'];
  for (const name of defaults) {
    await db.runAsync(
      'INSERT OR IGNORE INTO categories (id, name, is_default) VALUES (?, ?, 1)',
      `default-${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`,
      name
    );
  }
}

export async function markPreviousSectionCompleted(sectionId: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO progress (section_id, completed, updated_at)
     VALUES (?, 1, ?)
     ON CONFLICT(section_id) DO UPDATE SET completed = 1, updated_at = excluded.updated_at`,
    sectionId,
    new Date().toISOString()
  );
}

export async function saveLastParagraph(sectionId: string, paragraphId: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO progress (section_id, completed, last_paragraph_id, updated_at)
     VALUES (?, 0, ?, ?)
     ON CONFLICT(section_id) DO UPDATE SET last_paragraph_id = excluded.last_paragraph_id, updated_at = excluded.updated_at`,
    sectionId,
    paragraphId,
    new Date().toISOString()
  );
}

export async function addHighlight(input: {
  id: string;
  sectionId: string;
  paragraphId: string;
  selectedText: string;
  startOffset?: number;
  endOffset?: number;
}) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO highlights (id, section_id, paragraph_id, selected_text, start_offset, end_offset, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.sectionId,
    input.paragraphId,
    input.selectedText,
    input.startOffset ?? null,
    input.endOffset ?? null,
    new Date().toISOString()
  );
}

export async function addNote(input: {
  id: string;
  sectionId: string;
  paragraphId: string;
  selectedText?: string;
  noteText: string;
}) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO notes (id, section_id, paragraph_id, selected_text, note_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.id,
    input.sectionId,
    input.paragraphId,
    input.selectedText ?? null,
    input.noteText,
    new Date().toISOString()
  );
}
