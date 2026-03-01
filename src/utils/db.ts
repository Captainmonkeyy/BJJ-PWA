import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { TrainingClass, Technique } from '../types'
import type { TagTreeNode } from '../data/tags'
import { DEFAULT_TAG_TREE } from '../data/tags'

const DB_NAME = 'bjj-training-log'
const DB_VERSION = 1

interface BJJDB extends DBSchema {
  classes: {
    key: string
    value: TrainingClass
    indexes: { 'by-date': string }
  }
  techniques: {
    key: string
    value: Technique
    indexes: { 'by-class': string; 'by-date': string }
  }
  settings: {
    key: string
    value: unknown
  }
}

let dbPromise: Promise<IDBPDatabase<BJJDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<BJJDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const classStore = db.createObjectStore('classes', { keyPath: 'id' })
        classStore.createIndex('by-date', 'date')
        
        const techStore = db.createObjectStore('techniques', { keyPath: 'id' })
        techStore.createIndex('by-class', 'classId')
        techStore.createIndex('by-date', 'createdAt')
        
        db.createObjectStore('settings', { keyPath: 'key' })
      },
    })
  }
  return dbPromise
}

// 课程 CRUD
export async function saveClass(cls: TrainingClass) {
  const db = await getDB()
  await db.put('classes', cls)
  for (const tech of cls.techniques) {
    await db.put('techniques', tech)
  }
}

export async function getClass(id: string) {
  const db = await getDB()
  return db.get('classes', id)
}

export async function getAllClasses() {
  const db = await getDB()
  return db.getAllFromIndex('classes', 'by-date')
}

export async function deleteClass(id: string) {
  const db = await getDB()
  const cls = await db.get('classes', id)
  if (cls) {
    for (const tech of cls.techniques) {
      await db.delete('techniques', tech.id)
    }
    await db.delete('classes', id)
  }
}

// 招式查询
export async function getTechniquesByClassId(classId: string) {
  const db = await getDB()
  return db.getAllFromIndex('techniques', 'by-class', classId)
}

export async function getAllTechniques() {
  const db = await getDB()
  return db.getAll('techniques')
}

// 标签树顺序
const TAG_TREE_KEY = 'tag-tree-order'

export async function getTagTreeOrder(): Promise<TagTreeNode[]> {
  const db = await getDB()
  const stored = await db.get('settings', TAG_TREE_KEY) as { key: string; value: TagTreeNode[] } | undefined
  return stored?.value ?? DEFAULT_TAG_TREE
}

export async function saveTagTreeOrder(tree: TagTreeNode[]) {
  const db = await getDB()
  await db.put('settings', { key: TAG_TREE_KEY, value: tree })
}
