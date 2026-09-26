import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

let dbInstance = null;
let resolvedDbPath = null;

const CANDIDATE_DB_PATHS = [
  process.env.SQLITE_CATALOG_DB_PATH,
  process.env.CATALOG_DB_PATH,
  path.resolve(/*turbopackIgnore: true*/ process.cwd(), "../SuperAdminRBPL/data/catalog.db"),
  "c:/Users/Admin/Documents/GitHub/SuperAdminRBPL/data/catalog.db",
  path.resolve(/*turbopackIgnore: true*/ process.cwd(), "./data/catalog.db"),
].filter(Boolean);

/**
 * Locate the SQLite catalog.db file
 */
export function getCatalogDbPath() {
  if (resolvedDbPath && fs.existsSync(resolvedDbPath)) {
    return resolvedDbPath;
  }

  for (const candidate of CANDIDATE_DB_PATHS) {
    try {
      if (candidate && fs.existsSync(candidate)) {
        resolvedDbPath = candidate;
        return candidate;
      }
    } catch {
      // ignore check errors
    }
  }

  return null;
}

/**
 * Check if the SQLite database is available locally
 */
export function isSqliteDbAvailable() {
  const dbPath = getCatalogDbPath();
  return !!dbPath;
}

/**
 * Get or initialize read-only DatabaseSync instance
 */
export function getDatabaseInstance() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getCatalogDbPath();
  if (!dbPath) {
    console.warn("[sqliteDb] catalog.db path could not be resolved from candidates:", CANDIDATE_DB_PATHS);
    return null;
  }

  try {
    dbInstance = new DatabaseSync(dbPath, { readOnly: true });
    try {
      dbInstance.exec("PRAGMA query_only = ON;");
      dbInstance.exec("PRAGMA read_uncommitted = ON;");
    } catch {}
    return dbInstance;
  } catch (err) {
    console.error("[sqliteDb] Failed to initialize DatabaseSync with path " + dbPath + ":", err.message);
    return null;
  }
}

/**
 * Get a single document by its full path (e.g. 'companies/human/categories/test-strips')
 */
export function getDocFromSqlite(docPath) {
  const db = getDatabaseInstance();
  if (!db) return null;

  try {
    const stmt = db.prepare("SELECT data FROM documents WHERE path = ? LIMIT 1");
    const row = stmt.get(docPath);
    if (!row || !row.data) return null;

    return typeof row.data === "string" ? JSON.parse(row.data) : row.data;
  } catch (err) {
    console.error(`[sqliteDb] Error getting doc '${docPath}':`, err.message);
    return null;
  }
}

/**
 * Get all documents in a collection (e.g. 'companies/human/categories')
 */
export function getCollectionFromSqlite(collectionPath) {
  const db = getDatabaseInstance();
  if (!db) return [];

  try {
    const stmt = db.prepare("SELECT doc_id, data FROM documents WHERE collection_path = ?");
    const rows = stmt.all(collectionPath);
    return rows
      .map((r) => {
        try {
          const parsed = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
          return { id: r.doc_id, ...parsed };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (err) {
    console.error(`[sqliteDb] Error getting collection '${collectionPath}':`, err.message);
    return [];
  }
}

/**
 * Query documents whose path starts with a prefix
 */
export function queryDocumentsByPrefix(prefix) {
  const db = getDatabaseInstance();
  if (!db) return [];

  try {
    const stmt = db.prepare("SELECT path, collection_path, doc_id, data FROM documents WHERE path LIKE ?");
    const rows = stmt.all(`${prefix}%`);
    return rows
      .map((r) => {
        try {
          const parsed = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
          return {
            path: r.path,
            collection_path: r.collection_path,
            id: r.doc_id,
            ...parsed,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (err) {
    console.error(`[sqliteDb] Error querying documents by prefix '${prefix}':`, err.message);
    return [];
  }
}
