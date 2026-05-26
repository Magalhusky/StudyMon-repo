const STORAGE_KEYS = {
  pets: 'local_focus_pets',
  tasks: 'local_focus_tasks',
  sessions: 'local_focus_sessions',
  groups: 'local_focus_groups',
  user: 'local_focus_user',
};

const defaultUser = {
  id: 'local_user',
  name: 'Local Trainer',
  email: 'local@local',
  role: 'admin',
};

const createId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const loadStorage = (key) => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) || '[]');
  } catch (error) {
    return [];
  }
};

const saveStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const sortItems = (items, orderBy) => {
  if (!orderBy) return items;
  const direction = orderBy.startsWith('-') ? -1 : 1;
  const field = orderBy.replace(/^[-+]/, '');
  return [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    if (aValue === bValue) return 0;
    if (aValue === undefined || aValue === null) return 1 * direction;
    if (bValue === undefined || bValue === null) return -1 * direction;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * direction;
    }
    return aValue < bValue ? -1 * direction : 1 * direction;
  });
};

const limitItems = (items, limit) => {
  const parsed = Number(limit);
  return Number.isFinite(parsed) && parsed > 0 ? items.slice(0, parsed) : items;
};

const createEntityStore = (storageKey) => ({
  list: async (orderBy, limit) => {
    const items = sortItems(loadStorage(storageKey), orderBy);
    return limitItems(items, limit);
  },
  create: async (data) => {
    const now = new Date().toISOString();
    const item = {
      id: createId(),
      created_date: now,
      updated_date: now,
      ...data,
    };
    const items = [item, ...loadStorage(storageKey)];
    saveStorage(storageKey, items);
    return item;
  },
  update: async (id, data) => {
    const items = loadStorage(storageKey);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item not found: ${id}`);
    }
    const updated = {
      ...items[index],
      ...data,
      updated_date: new Date().toISOString(),
    };
    items[index] = updated;
    saveStorage(storageKey, items);
    return updated;
  },
  delete: async (id) => {
    const items = loadStorage(storageKey);
    const next = items.filter((item) => item.id !== id);
    saveStorage(storageKey, next);
    return { id };
  },
});

const getCurrentUser = () => {
  if (typeof window === 'undefined') return defaultUser;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.user);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // ignore
  }
  window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(defaultUser));
  return defaultUser;
};

const setCurrentUser = (user) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
};

export const base44 = {
  auth: {
    me: async () => getCurrentUser(),
    logout: (redirectUrl) => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEYS.user);
      }
      if (redirectUrl && typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    },
    redirectToLogin: (redirectUrl) => {
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl || '/';
      }
    },
  },
  entities: {
    FocusPet: createEntityStore(STORAGE_KEYS.pets),
    FocusTask: createEntityStore(STORAGE_KEYS.tasks),
    FocusSession: createEntityStore(STORAGE_KEYS.sessions),
    FocusGroup: createEntityStore(STORAGE_KEYS.groups),
  },
};
