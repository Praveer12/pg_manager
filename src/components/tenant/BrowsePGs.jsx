import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatCurrency } from '../../utils/formatters';
import { AMENITY_ICONS } from '../../data/mockData';

export default function BrowsePGs() {
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [priceRange, setPriceRange] = useState(15000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
      setProperties(await storage.getAll(STORAGE_KEYS.PROPERTIES));
    };
    fetchData();
  }, []);

  const property = properties[0];

  const vacantRooms = rooms.filter(r => {
    if (r.status !== 'vacant') return false;
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (r.rent > priceRange) return false;
    if (selectedAmenities.length > 0 && !selectedAmenities.every(a => r.amenities?.includes(a))) return false;
    if (searchQuery && !r.number.includes(searchQuery) && !r.type.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleAmenityFilter = (a) => {
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const handleBooking = async () => {
    await storage.add(STORAGE_KEYS.BOOKING_REQUESTS, {
      roomId: selectedRoom.id, propertyId: 'prop_001',
      message: bookingMessage, status: 'pending',
      moveInDate: new Date().toISOString().split('T')[0],
      stayType: 'Monthly',
    });
    setBookingSubmitted(true);
    setTimeout(() => {
      setShowBookingModal(false);
      setBookingSubmitted(false);
      setBookingMessage('');
    }, 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Browse Available Rooms</h2>
          <p className="subtitle">{vacantRooms.length} rooms available at {property?.name || 'Sunrise PG Residency'}</p>
        </div>
      </div>

      {/* Property Card */}
      {property && (
        <div className="glass-card-accent mb-xl animate-in" style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🏢</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ marginBottom: 4 }}>{property.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>📍 {property.address}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {property.amenities?.slice(0, 6).map((a, i) => (
                <span key={i} className="amenity-chip">{AMENITY_ICONS[a]} {a.replace(/_/g, ' ')}</span>
              ))}
              {property.amenities?.length > 6 && <span className="amenity-chip">+{property.amenities.length - 6} more</span>}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent-primary-light)' }}>
              {property.rating} ⭐
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rating</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card-static mb-lg animate-in animate-in-2" style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ width: 200 }}>
            <label className="form-label">Search</label>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Room number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ width: 150 }}>
            <label className="form-label">Room Type</label>
            <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Triple">Triple</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Max Budget: {formatCurrency(priceRange)}</label>
            <input type="range" className="range-slider" min="3000" max="15000" step="500" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} />
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Amenities</label>
          <div className="filter-chips">
            {['wifi', 'ac', 'attached_bath', 'balcony', 'tv', 'wardrobe', 'study_table'].map(a => (
              <button key={a} className={`filter-chip ${selectedAmenities.includes(a) ? 'active' : ''}`} onClick={() => toggleAmenityFilter(a)}>
                {AMENITY_ICONS[a]} {a.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Room Listings */}
      <div className="grid-auto">
        {vacantRooms.map((room) => (
          <div key={room.id} className="room-card" onClick={() => { setSelectedRoom(room); setShowBookingModal(true); }}>
            <div className="room-card-image">
              {room.images?.length > 0 ? (
                <img src={room.images[0]} alt={`Room ${room.number}`} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))' }}>🚪</div>
              )}
              <div className="room-status"><span className="badge badge-info">🔵 Available</span></div>
              <div className="room-type">{room.type}</div>
            </div>
            <div className="room-card-body">
              <h4>Room {room.number}</h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>Floor {room.floor}</div>
              <div className="room-price">{formatCurrency(room.rent)} <span>/month</span></div>
              <div className="room-amenities">
                {(room.amenities || []).slice(0, 4).map((a, i) => (
                  <span key={i} className="amenity-chip">{AMENITY_ICONS[a]} {a.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
            <div className="room-card-footer">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Deposit: {formatCurrency(room.deposit)}</span>
              <button className="btn btn-primary btn-sm">Book Now</button>
            </div>
          </div>
        ))}
      </div>

      {vacantRooms.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No rooms match your criteria</h3>
          <p>Try adjusting your filters or budget range.</p>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {bookingSubmitted ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🎉</div>
                <h3>Booking Request Sent!</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>The PG owner will review your request.</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h3>Book Room {selectedRoom.number}</h3>
                  <button className="modal-close" onClick={() => setShowBookingModal(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Room</span>
                      <span style={{ fontWeight: 600 }}>Room {selectedRoom.number} ({selectedRoom.type})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Rent</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(selectedRoom.rent)}/mo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Deposit</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(selectedRoom.deposit)}</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message to Owner</label>
                    <textarea className="form-textarea" placeholder="Introduce yourself and mention your requirements..." value={bookingMessage} onChange={(e) => setBookingMessage(e.target.value)} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleBooking}>Submit Booking Request</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
