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
};

// Generic CRUD operations
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

  // Get all items from a Supabase table
  async getAll(key) {
    if (!supabase) {
      console.warn("Supabase not configured yet. Returning empty array.");
      return [];
    }
    try {
      const { data, error } = await supabase.from(key).select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error(`Error fetching collection ${key}:`, e);
      return [];
    }
  },

  // Get a single item by ID from a Supabase table
  async getById(key, id) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from(key).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error(`Error fetching document ${key}/${id}:`, e);
      return null;
    }
  },

  // Add item to a Supabase table
  async add(key, item) {
    if (!supabase) return null;
    const newItem = {
      ...item,
      id: item.id || generateId(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase.from(key).insert([newItem]).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error(`Error adding document to ${key}:`, e);
      return null;
    }
  },

  // Update item in a Supabase table
  async update(key, id, updates) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from(key).update({
        ...updates,
        updatedAt: new Date().toISOString(),
      }).eq('id', id).select().single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error(`Error updating document ${key}/${id}:`, e);
      return null;
    }
  },

  // Delete item from a Supabase table
  async delete(key, id) {
    if (!supabase) return [];
    try {
      const { error } = await supabase.from(key).delete().eq('id', id);
      if (error) throw error;
      return [];
    } catch (e) {
      console.error(`Error deleting document ${key}/${id}:`, e);
      return [];
    }
  },
};

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export { STORAGE_KEYS };
export default storage;
