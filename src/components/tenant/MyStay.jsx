import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatCurrency, formatDate, getDaysRemaining } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { AMENITY_ICONS } from '../../data/mockData';

export default function MyStay() {
  const { user } = useAuth();
  const [guest, setGuest] = useState(null);
  const [room, setRoom] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [property, setProperty] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const guests = await storage.getAll(STORAGE_KEYS.GUESTS);
      const myGuest = guests.find(g => g.userId === user?.id || g.email === user?.email) || guests[0];
      setGuest(myGuest);
      if (myGuest) {
        const rooms = await storage.getAll(STORAGE_KEYS.ROOMS);
        const agreements = await storage.getAll(STORAGE_KEYS.AGREEMENTS);
        const properties = await storage.getAll(STORAGE_KEYS.PROPERTIES);
        setRoom(rooms.find(r => r.id === myGuest.roomId));
        setAgreement(agreements.find(a => a.guestId === myGuest.id));
        setProperty(properties.find(p => p.id === myGuest.propertyId));
      }
    };
    fetchData();
  }, [user]);

  const daysStayed = guest ? Math.floor((new Date() - new Date(guest.joinDate)) / (1000 * 60 * 60 * 24)) : 0;
  const agreementDaysLeft = agreement ? getDaysRemaining(agreement.endDate) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My Stay</h2>
          <p className="subtitle">Your current accommodation details</p>
        </div>
      </div>

      {/* Property Info */}
      {property && (
        <div className="glass-card-accent mb-lg animate-in" style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏢</div>
          <div>
            <h3 style={{ marginBottom: 2 }}>{property.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {property.address}</p>
          </div>
        </div>
      )}

      <div className="grid-2 mb-xl">
        {/* Room Details */}
        <div className="glass-card-static animate-in animate-in-2">
          <h4 style={{ marginBottom: 'var(--space-lg)' }}>🚪 Room Details</h4>
          {room ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <div style={{ width: '100%', height: 200, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: 'var(--space-md)' }}>
                  {room.images?.length > 0 ? <img src={room.images[0]} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : '🛏️'}
                </div>
                <h3>Room {room.number}</h3>
                <span className="badge badge-purple" style={{ marginTop: '6px' }}>{room.type}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                {[
                  ['Floor', `Floor ${room.floor}`],
                  ['Rent', formatCurrency(room.rent)],
                  ['Deposit', formatCurrency(room.deposit)],
                  ['Days Stayed', `${daysStayed} days`],
                ].map(([label, value], i) => (
                  <div key={i} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'var(--space-lg)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Amenities</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(room.amenities || []).map((a, i) => (
                    <span key={i} className="filter-chip active">{AMENITY_ICONS[a]} {a.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state"><p>No room assigned yet.</p></div>
          )}
        </div>

        {/* Agreement & Guest Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="glass-card-static animate-in animate-in-3">
            <h4 style={{ marginBottom: 'var(--space-md)' }}>📋 Agreement</h4>
            {agreement ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {[
                  ['Type', agreement.type],
                  ['Duration', `${formatDate(agreement.startDate)} — ${formatDate(agreement.endDate)}`],
                  ['Monthly Rent', formatCurrency(agreement.rent)],
                  ['Deposit', `${formatCurrency(agreement.deposit)} ${agreement.depositPaid ? '✅ Paid' : '⏳ Pending'}`],
                  ['Status', agreement.status],
                  ['Remaining', agreementDaysLeft > 0 ? `${agreementDaysLeft} days` : 'Expired'],
                ].map(([l, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No agreement on file.</p>
            )}
          </div>

          <div className="glass-card-static animate-in animate-in-4">
            <h4 style={{ marginBottom: 'var(--space-md)' }}>👤 My Info</h4>
            {guest && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {[
                  ['Name', guest.name],
                  ['Email', guest.email],
                  ['Phone', guest.phone],
                  ['ID', `${guest.idType}: ${guest.idNumber}`],
                  ['Occupation', guest.occupation],
                  ['Company', guest.company],
                  ['Join Date', formatDate(guest.joinDate)],
                  ['Emergency', `${guest.emergencyName} (${guest.emergencyContact})`],
                ].map(([l, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontWeight: 500 }}>{v || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PG Rules */}
          {property?.rules && (
            <div className="glass-card-static animate-in animate-in-5">
              <h4 style={{ marginBottom: 'var(--space-md)' }}>📜 PG Rules</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {property.rules.map((rule, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>•</span> {rule}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
