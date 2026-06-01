import { createContext, useContext, useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../utils/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = storage.get(STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    const users = await storage.getAll(STORAGE_KEYS.USERS);
    const found = users.find(
      u => u.email === email && u.password === password && u.role === role
    );
    
    if (found) {
      const userData = { ...found };
      delete userData.password;
      setUser(userData);
      storage.set(STORAGE_KEYS.CURRENT_USER, userData);
      return { success: true, user: userData };
    }
    
    return { success: false, error: 'Invalid credentials. Please check your email, password, and role.' };
  };

  const register = async (userData) => {
    const users = await storage.getAll(STORAGE_KEYS.USERS);
    
    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
      return { success: false, error: 'Email already registered.' };
    }
    
    // Remove extra fields that don't belong in pgm_users table
    const { occupation, company, pgName, pgCity, ...userDbData } = userData;

    const newUser = await storage.add(STORAGE_KEYS.USERS, {
      ...userDbData,
      avatar: null,
    });
    
    if (!newUser) {
      return { success: false, error: 'Failed to create user. Please check database logs.' };
    }
    
    // Create corresponding property if the user is an owner
    if (newUser.role === 'owner') {
      await storage.add(STORAGE_KEYS.PROPERTIES, {
        ownerId: newUser.id,
        name: pgName || `${newUser.name}'s PG Residency`,
        city: pgCity || 'Bangalore',
        address: pgCity ? `Koramangala, ${pgCity}` : '42, MG Road, Koramangala, Bangalore',
        totalRooms: 12,
        amenities: ['wifi', 'ac', 'parking', 'laundry', 'kitchen', 'security', 'cctv'],
        rules: ['No smoking inside rooms', 'Visitor hours: 9 AM - 9 PM'],
        rating: 4.5,
        images: [],
        paymentDetails: {
          upiPhone: newUser.phone || '',
          upiId: '',
          qrImage: null,
        }
      });
    }
    
    const sessionData = { ...newUser };
    delete sessionData.password;
    setUser(sessionData);
    storage.set(STORAGE_KEYS.CURRENT_USER, sessionData);
    
    return { success: true, user: sessionData };
  };

  const logout = () => {
    setUser(null);
    storage.remove(STORAGE_KEYS.CURRENT_USER);
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const updatedUser = await storage.update(STORAGE_KEYS.USERS, user.id, updates);
    if (updatedUser) {
      const sessionData = { ...updatedUser };
      delete sessionData.password;
      setUser(sessionData);
      storage.set(STORAGE_KEYS.CURRENT_USER, sessionData);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
