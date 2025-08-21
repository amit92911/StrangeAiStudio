// Simple localStorage-backed data layer for Projects, Chats, Messages, Prompts

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function readStore(key) {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStore(key, value) {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function sortItems(items, sortKey) {
  if (!sortKey) return items;
  const desc = sortKey.startsWith('-');
  const field = desc ? sortKey.slice(1) : sortKey;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    const aNum = typeof av === 'string' && Date.parse(av) ? Date.parse(av) : av;
    const bNum = typeof bv === 'string' && Date.parse(bv) ? Date.parse(bv) : bv;
    if (aNum == null && bNum == null) return 0;
    if (aNum == null) return desc ? 1 : -1;
    if (bNum == null) return desc ? -1 : 1;
    if (aNum < bNum) return desc ? 1 : -1;
    if (aNum > bNum) return desc ? -1 : 1;
    return 0;
  });
}

function filterItems(items, query) {
  if (!query || typeof query !== 'object') return items;
  return items.filter((item) => {
    return Object.entries(query).every(([k, v]) => item[k] === v);
  });
}

export function makeEntity(storeKey) {
  return {
    async list(sortKey) {
      const data = readStore(storeKey);
      return sortItems(data, sortKey);
    },
    async filter(query, sortKey) {
      const data = readStore(storeKey);
      const filtered = filterItems(data, query);
      return sortItems(filtered, sortKey);
    },
    async create(payload) {
      const now = new Date().toISOString();
      const item = {
        id: generateId(),
        created_date: now,
        updated_date: now,
        ...payload
      };
      const data = readStore(storeKey);
      data.push(item);
      writeStore(storeKey, data);
      return item;
    },
    async update(id, updates) {
      const data = readStore(storeKey);
      const idx = data.findIndex((x) => x.id === id);
      if (idx === -1) throw new Error(`Item not found in ${storeKey}`);
      const updated = { ...data[idx], ...updates, updated_date: new Date().toISOString() };
      data[idx] = updated;
      writeStore(storeKey, data);
      return updated;
    },
    async delete(id) {
      const data = readStore(storeKey);
      const next = data.filter((x) => x.id !== id);
      writeStore(storeKey, next);
      return { success: true };
    }
  };
}

export const STORAGE_KEYS = {
  projects: 'sas_projects',
  chats: 'sas_chats',
  messages: 'sas_messages',
  prompts: 'sas_prompts'
};


