import { supabase } from '../lib/supabase';

const STORAGE_KEYS = {
  USERS: 'pgm_users',
  PROPERTIES: 'pgm_properties',
  ROOMS: 'pgm_rooms',
  GUESTS: 'pgm_guests',
  PAYMENTS: 'pgm_payments',
  AGREEMENTS: 'pgm_agreements',
  MAINTENANCE: 'pgm_maintenance',
  NOTICES: 'pgm_notices',
  CURRENT_USER: 'pgm_current_user',
  BOOKING_REQUESTS: 'pgm_booking_requests',
  ACTIVITIES: 'pgm_activities',
};

// Generic CRUD operations with robust localStorage fallback
export const storage = {
  // Local storage for current user auth state
  get(key) {
    if (key === STORAGE_KEYS.CURRENT_USER) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    }
    return null;
  },

  set(key, value) {
    if (key === STORAGE_KEYS.CURRENT_USER) {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
    return false;
  },

  remove(key) {
    if (key === STORAGE_KEYS.CURRENT_USER) {
      localStorage.removeItem(key);
    }
  },

  // Get all items from a Supabase table, with localStorage fallback
  async getAll(key) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from(key).select('*');
        if (!error) return data || [];
        console.warn(`Supabase fetch failed for ${key}, falling back to localStorage:`, error.message);
      } catch (e) {
        console.warn(`Supabase fetch error for ${key}, falling back to localStorage:`, e);
      }
    }
    // LocalStorage Fallback
    try {
      const localData = localStorage.getItem(key);
      return localData ? JSON.parse(localData) : [];
    } catch (e) {
      console.error(`Error reading from localStorage for ${key}:`, e);
      return [];
    }
  },

  // Get a single item by ID from a Supabase table, with localStorage fallback
  async getById(key, id) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from(key).select('*').eq('id', id).single();
        if (!error) return data;
        console.warn(`Supabase single fetch failed for ${key}/${id}, falling back to localStorage:`, error.message);
      } catch (e) {
        console.warn(`Supabase single fetch error for ${key}/${id}, falling back to localStorage:`, e);
      }
    }
    // LocalStorage Fallback
    try {
      const localData = localStorage.getItem(key);
      const items = localData ? JSON.parse(localData) : [];
      return items.find(item => item.id === id) || null;
    } catch (e) {
      console.error(`Error reading document from localStorage for ${key}/${id}:`, e);
      return null;
    }
  },

  // Add item to a Supabase table, with localStorage fallback
  async add(key, item) {
    const newItem = {
      ...item,
      id: item.id || generateId(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (supabase) {
      try {
        const { data, error } = await supabase.from(key).insert([newItem]).select().single();
        if (!error) return data;
        console.warn(`Supabase insert failed for ${key}, falling back to localStorage:`, error.message);
      } catch (e) {
        console.warn(`Supabase insert error for ${key}, falling back to localStorage:`, e);
      }
    }
    // LocalStorage Fallback
    try {
      const localData = localStorage.getItem(key);
      const items = localData ? JSON.parse(localData) : [];
      items.push(newItem);
      localStorage.setItem(key, JSON.stringify(items));
      return newItem;
    } catch (e) {
      console.error(`Error saving to localStorage for ${key}:`, e);
      return null;
    }
  },

  // Update item in a Supabase table, with localStorage fallback
  async update(key, id, updates) {
    const updatedAt = new Date().toISOString();
    if (supabase) {
      try {
        const { data, error } = await supabase.from(key).update({
          ...updates,
          updatedAt,
        }).eq('id', id).select().single();
        if (!error) return data;
        console.warn(`Supabase update failed for ${key}/${id}, falling back to localStorage:`, error.message);
      } catch (e) {
        console.warn(`Supabase update error for ${key}/${id}, falling back to localStorage:`, e);
      }
    }
    // LocalStorage Fallback
    try {
      const localData = localStorage.getItem(key);
      const items = localData ? JSON.parse(localData) : [];
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        const updatedItem = {
          ...items[index],
          ...updates,
          updatedAt,
        };
        items[index] = updatedItem;
        localStorage.setItem(key, JSON.stringify(items));
        return updatedItem;
      }
      return null;
    } catch (e) {
      console.error(`Error updating in localStorage for ${key}/${id}:`, e);
      return null;
    }
  },

  // Delete item from a Supabase table, with localStorage fallback
  async delete(key, id) {
    if (supabase) {
      try {
        const { error } = await supabase.from(key).delete().eq('id', id);
        if (!error) return [];
        console.warn(`Supabase delete failed for ${key}/${id}, falling back to localStorage:`, error.message);
      } catch (e) {
        console.warn(`Supabase delete error for ${key}/${id}, falling back to localStorage:`, e);
      }
    }
    // LocalStorage Fallback
    try {
      const localData = localStorage.getItem(key);
      const items = localData ? JSON.parse(localData) : [];
      const filtered = items.filter(item => item.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      return [];
    } catch (e) {
      console.error(`Error deleting in localStorage for ${key}/${id}:`, e);
      return [];
    }
  },

  // Log a new activity record
  async logActivity(icon, type, text, details = '') {
    return await this.add(STORAGE_KEYS.ACTIVITIES, { icon, type, text, details });
  },
};

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export { STORAGE_KEYS };
export default storage;
