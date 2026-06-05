import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OwnerPortal from './pages/OwnerPortal';
import TenantPortal from './pages/TenantPortal';

// Mock data removed
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner lg"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'owner' ? '/owner' : '/tenant'} replace />;
  
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'owner' ? '/owner' : '/tenant'} replace />;
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/owner/*" element={
        <ProtectedRoute role="owner"><OwnerPortal /></ProtectedRoute>
      } />
      <Route path="/tenant/*" element={
        <ProtectedRoute role="tenant"><TenantPortal /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // Initialize theme from localStorage on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('pgm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Data cleanup script to fix any corrupted state from previous bugs
    try {
      const guests = JSON.parse(localStorage.getItem('pgm_guests') || '[]');
      const rooms = JSON.parse(localStorage.getItem('pgm_rooms') || '[]');
      const agreements = JSON.parse(localStorage.getItem('pgm_agreements') || '[]');
      const maintenance = JSON.parse(localStorage.getItem('pgm_maintenance') || '[]');
      let updated = false;

      // Fix agreements for checked out guests
      const checkedOutGuestsIds = guests.filter(g => g.status === 'checked_out').map(g => g.id);
      const cleanedAgreements = agreements.map(agr => {
        if (checkedOutGuestsIds.includes(agr.guestId) && (agr.status === 'active' || agr.status === 'expiring')) {
          updated = true;
          return { ...agr, status: 'expired' };
        }
        return agr;
      });

      // Fix room statuses based on actual active guests and maintenance status
      const activeGuests = guests.filter(g => g.status === 'active');
      const activeMaintenance = maintenance.filter(m => m.status !== 'resolved');
      
      const cleanedRooms = rooms.map(room => {
        const hasMaintenance = activeMaintenance.some(m => m.roomId === room.id);
        const roomGuests = activeGuests.filter(g => g.roomId === room.id);
        const capacity = room.type === 'Single' ? 1 : room.type === 'Double' ? 2 : room.type === 'Triple' ? 3 : 1;
        
        let expectedStatus = roomGuests.length >= capacity ? 'occupied' : 'vacant';
        if (hasMaintenance) expectedStatus = 'maintenance';

        if (room.status !== expectedStatus) {
          updated = true;
          return { ...room, status: expectedStatus };
        }
        return room;
      });

      if (updated) {
        localStorage.setItem('pgm_agreements', JSON.stringify(cleanedAgreements));
        localStorage.setItem('pgm_rooms', JSON.stringify(cleanedRooms));
        console.log('PGM: Cleaned up inconsistent local storage data');
      }
    } catch (e) {
      console.error('PGM: Error during data cleanup', e);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
