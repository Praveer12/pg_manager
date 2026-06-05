import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatDate, formatPhone, getInitials, formatCurrency } from '../../utils/formatters';
import AgreementDocument from './AgreementDocument';

export default function GuestManager() {
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAgreementDoc, setShowAgreementDoc] = useState(false);
  const [showReallocateModal, setShowReallocateModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [reallocateRoomId, setReallocateRoomId] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', emergencyContact: '', emergencyName: '',
    idType: 'Aadhaar', idNumber: '', occupation: '', company: '',
    roomId: '', joinDate: new Date().toISOString().split('T')[0],
    agreementType: 'Monthly', customMonths: 3,
    depositPaid: false, firstMonthRentPaid: false,
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setGuests(await storage.getAll(STORAGE_KEYS.GUESTS));
    setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
    setAgreements(await storage.getAll(STORAGE_KEYS.AGREEMENTS));
    setProperties(await storage.getAll(STORAGE_KEYS.PROPERTIES));
  };

  const availableRooms = rooms.filter(r => {
    if (r.status === 'maintenance') return false;
    const capacity = r.type === 'Single' ? 1 : r.type === 'Double' ? 2 : r.type === 'Triple' ? 3 : 1;
    const currentGuests = guests.filter(g => g.roomId === r.id && g.status === 'active').length;
    return currentGuests < capacity;
  });

  const filteredGuests = guests.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.phone?.includes(searchQuery)
  );

  const getAgreementEndDate = (startDate, type, customMonths) => {
    const end = new Date(startDate);
    switch (type) {
      case 'Monthly': end.setMonth(end.getMonth() + 1); break;
      case 'Quarterly': end.setMonth(end.getMonth() + 3); break;
      case 'Semi-Annual': end.setMonth(end.getMonth() + 6); break;
      case 'Annual': end.setFullYear(end.getFullYear() + 1); break;
      case 'Custom': end.setMonth(end.getMonth() + parseInt(customMonths || 1)); break;
      default: end.setMonth(end.getMonth() + 1);
    }
    return end.toISOString().split('T')[0];
  };

  const handleAddGuest = async () => {
    if (!formData.name || !formData.phone || !formData.roomId) return;
    
    const { agreementType, customMonths, checkoutDate, depositPaid, firstMonthRentPaid, ...guestDbData } = formData;
    const newGuest = await storage.add(STORAGE_KEYS.GUESTS, {
      ...guestDbData, status: 'active', leaveDate: null,
    });

    const room = rooms.find(r => r.id === formData.roomId);
    const capacity = room?.type === 'Single' ? 1 : room?.type === 'Double' ? 2 : room?.type === 'Triple' ? 3 : 1;
    const currentGuestsCount = guests.filter(g => g.roomId === formData.roomId && g.status === 'active').length;

    // Update room status
    await storage.update(STORAGE_KEYS.ROOMS, formData.roomId, {
      status: currentGuestsCount + 1 >= capacity ? 'occupied' : 'vacant'
    });

    // Create agreement with selected type
    const endDate = getAgreementEndDate(formData.joinDate, formData.agreementType, formData.customMonths);

    await storage.add(STORAGE_KEYS.AGREEMENTS, {
      guestId: newGuest.id, roomId: formData.roomId,
      type: formData.agreementType === 'Custom' ? 'Custom' : formData.agreementType,
      startDate: formData.joinDate,
      endDate: endDate,
      rent: room?.rent || 0, deposit: room?.deposit || 0,
      depositPaid: formData.depositPaid, status: 'active',
      terms: `${formData.agreementType} agreement.`,
    });

    // Create payment record for the first month rent
    const joinDateObj = new Date(formData.joinDate);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    await storage.add(STORAGE_KEYS.PAYMENTS, {
      guestId: newGuest.id, roomId: formData.roomId,
      amount: room?.rent || 0,
      month: monthNames[joinDateObj.getMonth()],
      year: joinDateObj.getFullYear(),
      status: formData.firstMonthRentPaid ? 'paid' : 'pending',
      dueDate: formData.joinDate,
      paidDate: formData.firstMonthRentPaid ? new Date().toISOString().split('T')[0] : null,
      method: formData.firstMonthRentPaid ? 'Cash/UPI' : null,
      receiptNo: '',
      notes: 'First month rent',
    });

    await storage.logActivity(
      '👥',
      'guest_checkin',
      `New guest **${newGuest.name}** checked in to **Room ${room?.number || ''}**`,
      `Agreement: ${formData.agreementType} | Rent: ₹${room?.rent || 0}`
    );

    setShowModal(false);
    setFormData({ name: '', email: '', phone: '', emergencyContact: '', emergencyName: '', idType: 'Aadhaar', idNumber: '', occupation: '', company: '', roomId: '', joinDate: new Date().toISOString().split('T')[0], agreementType: 'Monthly', customMonths: 3, depositPaid: false, firstMonthRentPaid: false });
    await refreshData();
  };

  const handleReallocate = async () => {
    if (!selectedGuest || !reallocateRoomId) return;
    
    // Update guest's room
    await storage.update(STORAGE_KEYS.GUESTS, selectedGuest.id, { roomId: reallocateRoomId });
    
    // Update active agreement's room and rent to match new room
    const newRoom = rooms.find(r => r.id === reallocateRoomId);
    const agr = agreements.find(a => a.guestId === selectedGuest.id && a.status === 'active');
    if (agr && newRoom) {
      await storage.update(STORAGE_KEYS.AGREEMENTS, agr.id, {
        roomId: reallocateRoomId,
        rent: newRoom.rent,
        deposit: newRoom.deposit
      });
    }

    const oldRoom = rooms.find(r => r.id === selectedGuest.roomId);
    await storage.logActivity(
      '🔀',
      'guest_reallocate',
      `Guest **${selectedGuest.name}** reallocated from Room **${oldRoom?.number || ''}** to **Room ${newRoom?.number || ''}**`,
      `New Rent: ₹${newRoom?.rent || 0}`
    );

    setShowReallocateModal(false);
    setSelectedGuest(null);
    setReallocateRoomId('');
    await refreshData();
  };

  const handleCheckout = async (guest) => {
    if (!confirm(`Check out ${guest.name}?`)) return;
    
    const room = rooms.find(r => r.id === guest.roomId);
    await storage.update(STORAGE_KEYS.GUESTS, guest.id, { status: 'checked_out', checkoutDate: new Date().toISOString() });
    
    // Check remaining active guests in this room to determine correct room status
    const remainingGuests = guests.filter(g => g.roomId === guest.roomId && g.status === 'active' && g.id !== guest.id);
    const capacity = room?.type === 'Single' ? 1 : room?.type === 'Double' ? 2 : room?.type === 'Triple' ? 3 : 1;
    let newRoomStatus = 'vacant';
    if (remainingGuests.length >= capacity) {
      newRoomStatus = 'occupied';
    } else if (remainingGuests.length > 0) {
      // Partially occupied — keep status as occupied (or you could mark it vacant so it shows as available)
      newRoomStatus = 'vacant';
    }
    await storage.update(STORAGE_KEYS.ROOMS, guest.roomId, { status: newRoomStatus });
    
    // Mark the guest's active agreements as expired
    const guestAgreements = agreements.filter(a => a.guestId === guest.id && (a.status === 'active' || a.status === 'expiring'));
    for (const agr of guestAgreements) {
      await storage.update(STORAGE_KEYS.AGREEMENTS, agr.id, { status: 'expired' });
    }
    
    await storage.logActivity(
      '🚪',
      'guest_checkout',
      `Guest **${guest.name}** checked out from **Room ${room?.number || ''}**`,
      `Checkout Date: ${new Date().toLocaleDateString()}`
    );
    
    await refreshData();
    setShowDetailModal(false);
  };

  const viewGuestDetails = (guest) => {
    setSelectedGuest(guest);
    setShowDetailModal(true);
  };

  const viewGuestAgreement = (guest) => {
    const agr = agreements.find(a => a.guestId === guest.id);
    if (agr) {
      setSelectedAgreement(agr);
      setSelectedGuest(guest);
      setShowAgreementDoc(true);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Guest Management</h2>
          <p className="subtitle">{guests.filter(g => g.status === 'active').length} active guests</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Guest</button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-lg)', maxWidth: 400 }}>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search guests by name, email, phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Guest Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Room</th>
              <th>Phone</th>
              <th>Occupation</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map((guest) => {
              const room = rooms.find(r => r.id === guest.roomId);
              const hasAgreement = agreements.some(a => a.guestId === guest.id);
              return (
                <tr key={guest.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <div className="guest-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                        {getInitials(guest.name)}
                      </div>
                      <div>
                        <div className="cell-primary">{guest.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{guest.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>Room {room?.number || '—'}</td>
                  <td>{formatPhone(guest.phone)}</td>
                  <td>{guest.occupation || '—'}</td>
                  <td>{formatDate(guest.joinDate)}</td>
                  <td>
                    <span className={`status-badge ${guest.status === 'active' ? 'status-badge-success' : 'status-badge-neutral'}`}>
                      <span className={`status-dot-indicator ${guest.status === 'active' ? 'success' : 'neutral'}`}></span>
                      {guest.status === 'active' ? 'Active' : 'Checked Out'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => viewGuestDetails(guest)}>👁️ View</button>
                      {hasAgreement && (
                        <button className="btn btn-ghost btn-sm" onClick={() => viewGuestAgreement(guest)} style={{ color: 'var(--accent-primary-light)' }}>📋 Agreement</button>
                      )}
                      {guest.status === 'active' && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedGuest(guest); setReallocateRoomId(''); setShowReallocateModal(true); }}>🔀 Reallocate</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleCheckout(guest)} style={{ color: 'var(--warning)' }}>🚪 Checkout</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredGuests.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No guests found</h3>
            <p>Add your first guest or try a different search.</p>
          </div>
        )}
      </div>

      {/* Add Guest Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Guest</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Guest full name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Room *</label>
                  <select className="form-select" value={formData.roomId} onChange={(e) => setFormData(p => ({ ...p, roomId: e.target.value }))}>
                    <option value="">Select available room</option>
                    {availableRooms.map(r => {
                      const currentCount = guests.filter(g => g.roomId === r.id && g.status === 'active').length;
                      const capacity = r.type === 'Single' ? 1 : r.type === 'Double' ? 2 : r.type === 'Triple' ? 3 : 1;
                      return (
                        <option key={r.id} value={r.id}>
                          Room {r.number} ({r.type} - {currentCount}/{capacity} filled) - {formatCurrency(r.rent)}/mo
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="email@example.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" placeholder="10-digit number" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ID Type</label>
                  <select className="form-select" value={formData.idType} onChange={(e) => setFormData(p => ({ ...p, idType: e.target.value }))}>
                    <option>Aadhaar</option><option>PAN</option><option>Driving License</option><option>Passport</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ID Number</label>
                  <input className="form-input" placeholder="ID number" value={formData.idNumber} onChange={(e) => setFormData(p => ({ ...p, idNumber: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Occupation</label>
                  <input className="form-input" placeholder="e.g., Software Engineer" value={formData.occupation} onChange={(e) => setFormData(p => ({ ...p, occupation: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company/Institute</label>
                  <input className="form-input" placeholder="Where do they work?" value={formData.company} onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Emergency Contact Name</label>
                  <input className="form-input" placeholder="Emergency contact name" value={formData.emergencyName} onChange={(e) => setFormData(p => ({ ...p, emergencyName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Contact Phone</label>
                  <input className="form-input" placeholder="Emergency phone number" value={formData.emergencyContact} onChange={(e) => setFormData(p => ({ ...p, emergencyContact: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Move-in Date</label>
                <input type="date" className="form-input" value={formData.joinDate} onChange={(e) => setFormData(p => ({ ...p, joinDate: e.target.value }))} />
              </div>

              {/* Agreement Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📋 Agreement Type
                </label>
                <div className="agreement-type-grid">
                  {[
                    { value: 'Monthly', label: 'Monthly', desc: '1 month', icon: '📅' },
                    { value: 'Quarterly', label: 'Quarterly', desc: '3 months', icon: '📆' },
                    { value: 'Semi-Annual', label: 'Half-Yearly', desc: '6 months', icon: '🗓️' },
                    { value: 'Annual', label: 'Yearly', desc: '12 months', icon: '📋' },
                    { value: 'Custom', label: 'Custom', desc: 'Select', icon: '⚙️' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`agreement-type-option ${formData.agreementType === opt.value ? 'selected' : ''}`}
                      onClick={() => setFormData(p => ({ ...p, agreementType: opt.value }))}
                    >
                      <span className="agreement-type-icon">{opt.icon}</span>
                      <span className="agreement-type-label">{opt.label}</span>
                      <span className="agreement-type-desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                {formData.agreementType === 'Custom' && (
                  <div className="form-group" style={{ marginTop: 'var(--space-sm)' }}>
                    <label className="form-label">Number of Months</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max="60"
                      value={formData.customMonths}
                      onChange={(e) => setFormData(p => ({ ...p, customMonths: e.target.value }))}
                      placeholder="Enter months"
                    />
                  </div>
                )}
              </div>
              <div className="form-row" style={{ marginTop: 'var(--space-md)' }}>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input type="checkbox" id="depositPaidCheck" checked={formData.depositPaid} onChange={(e) => setFormData(p => ({ ...p, depositPaid: e.target.checked }))} style={{ width: 'auto' }} />
                  <label htmlFor="depositPaidCheck" className="form-label" style={{ marginBottom: 0 }}>Security Deposit Collected ✓</label>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input type="checkbox" id="firstRentCheck" checked={formData.firstMonthRentPaid} onChange={(e) => setFormData(p => ({ ...p, firstMonthRentPaid: e.target.checked }))} style={{ width: 'auto' }} />
                  <label htmlFor="firstRentCheck" className="form-label" style={{ marginBottom: 0 }}>First Month Rent Collected ✓</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddGuest}>Add Guest & Create Agreement</button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Detail Modal */}
      {showDetailModal && selectedGuest && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Guest Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <div className="guest-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                  {getInitials(selectedGuest.name)}
                </div>
                <div>
                  <h3 style={{ marginBottom: 2 }}>{selectedGuest.name}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedGuest.occupation} at {selectedGuest.company}</div>
                  <span className={`status-badge ${selectedGuest.status === 'active' ? 'status-badge-success' : 'status-badge-neutral'}`} style={{ marginTop: 6 }}>
                    <span className={`status-dot-indicator ${selectedGuest.status === 'active' ? 'success' : 'neutral'}`}></span>
                    {selectedGuest.status === 'active' ? 'Active' : 'Checked Out'}
                  </span>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 'var(--space-md)' }}>
                {[
                  ['📧 Email', selectedGuest.email],
                  ['📱 Phone', formatPhone(selectedGuest.phone)],
                  ['🚪 Room', `Room ${rooms.find(r => r.id === selectedGuest.roomId)?.number || '—'}`],
                  ['🆔 ID', `${selectedGuest.idType}: ${selectedGuest.idNumber}`],
                  ['📅 Join Date', formatDate(selectedGuest.joinDate)],
                  ['🏢 Company', selectedGuest.company || '—'],
                  ['📞 Emergency', `${selectedGuest.emergencyName || '—'} (${formatPhone(selectedGuest.emergencyContact)})`],
                ].map(([label, value], i) => (
                  <div key={i} style={{ padding: 'var(--space-sm)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Agreement Section in Detail Modal */}
              {(() => {
                const agr = agreements.find(a => a.guestId === selectedGuest.id);
                if (!agr) return (
                  <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>⚠️ No agreement found for this guest</div>
                  </div>
                );
                return (
                  <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>📋 Agreement Details</div>
                      <button className="btn btn-outline btn-sm" onClick={() => {
                        setShowDetailModal(false);
                        setSelectedAgreement(agr);
                        setShowAgreementDoc(true);
                      }}>
                        📄 View Full Agreement
                      </button>
                    </div>
                    <div className="grid-3" style={{ gap: 'var(--space-sm)', fontSize: '0.8rem' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> {agr.type}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Start:</span> {formatDate(agr.startDate)}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>End:</span> {formatDate(agr.endDate)}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
              {selectedGuest.status === 'active' && (
                <button className="btn btn-danger" onClick={() => handleCheckout(selectedGuest)}>🚪 Check Out Guest</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agreement Document Viewer */}
      {showAgreementDoc && selectedAgreement && (
        <AgreementDocument
          agreement={selectedAgreement}
          guest={selectedGuest || guests.find(g => g.id === selectedAgreement.guestId)}
          room={rooms.find(r => r.id === selectedAgreement.roomId)}
          property={properties.find(p => p.id === selectedAgreement.propertyId)}
          onClose={() => { setShowAgreementDoc(false); setSelectedAgreement(null); }}
        />
      )}

      {/* Reallocate Room Modal */}
      {showReallocateModal && selectedGuest && (
        <div className="modal-overlay" onClick={() => setShowReallocateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reallocate Room</h3>
              <button className="modal-close" onClick={() => setShowReallocateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <strong>Guest:</strong> {selectedGuest.name}<br/>
                <strong>Current Room:</strong> Room {rooms.find(r => r.id === selectedGuest.roomId)?.number || '—'}
              </div>
              <div className="form-group">
                <label className="form-label">Select New Room *</label>
                <select className="form-select" value={reallocateRoomId} onChange={(e) => setReallocateRoomId(e.target.value)}>
                  <option value="">Choose an available room...</option>
                  {availableRooms.filter(r => r.id !== selectedGuest.roomId).map(r => {
                    const currentCount = guests.filter(g => g.roomId === r.id && g.status === 'active').length;
                    const capacity = r.type === 'Single' ? 1 : r.type === 'Double' ? 2 : r.type === 'Triple' ? 3 : 1;
                    return (
                      <option key={r.id} value={r.id}>
                        Room {r.number} ({r.type} - {currentCount}/{capacity} filled) - {formatCurrency(r.rent)}/mo
                      </option>
                    );
                  })}
                </select>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Note: This will also update the rent and deposit in their active agreement to match the new room's rates.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReallocateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReallocate} disabled={!reallocateRoomId}>Confirm Change</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
