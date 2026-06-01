import { useState, useEffect, useRef } from 'react';
import storage, { STORAGE_KEYS, generateId } from '../../utils/storage';
import { formatCurrency } from '../../utils/formatters';
import { AMENITY_ICONS, STATUS_CONFIG } from '../../data/mockData';

export default function RoomManager() {
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    number: '', floor: 1, type: 'Single', rent: '', deposit: '',
    amenities: [], description: '', images: [],
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
    setGuests(await storage.getAll(STORAGE_KEYS.GUESTS));
  };

  const filteredRooms = rooms.filter(room => {
    if (filterStatus !== 'all' && room.status !== filterStatus) return false;
    if (filterType !== 'all' && room.type !== filterType) return false;
    if (searchQuery && !room.number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({ number: '', floor: 1, type: 'Single', rent: '', deposit: '', amenities: [], description: '', images: [] });
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      number: room.number, floor: room.floor, type: room.type,
      rent: room.rent, deposit: room.deposit,
      amenities: room.amenities || [], description: room.description || '',
      images: room.images || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.number || !formData.rent) return;

    const { guestId, ...roomDbData } = formData;

    if (editingRoom) {
      await storage.update(STORAGE_KEYS.ROOMS, editingRoom.id, {
        ...roomDbData, rent: Number(formData.rent), deposit: Number(formData.deposit || formData.rent * 2),
      });
      await storage.logActivity('🚪', 'room_edit', `Room **${formData.number}** details updated`, `Type: ${formData.type} | Rent: ₹${formData.rent}`);
    } else {
      await storage.add(STORAGE_KEYS.ROOMS, {
        ...roomDbData, rent: Number(formData.rent), deposit: Number(formData.deposit || formData.rent * 2),
        status: 'vacant',
      });
      await storage.logActivity('🚪', 'room_add', `New Room **${formData.number}** (${formData.type}) added`, `Rent: ₹${formData.rent} | Deposit: ₹${formData.deposit || formData.rent * 2}`);
    }
    setShowModal(false);
    await refreshData();
  };

  const toggleStatus = async (room) => {
    const currentGuests = guests.filter(g => g.roomId === room.id && g.status === 'active').length;
    if (currentGuests > 0) {
      alert("Cannot change status of a room that has active guests.");
      return;
    }
    const newStatus = room.status === 'maintenance' ? 'vacant' : 'maintenance';
    await storage.update(STORAGE_KEYS.ROOMS, room.id, { status: newStatus });
    
    const statusLabels = { vacant: 'Vacant', maintenance: 'Under Maintenance' };
    await storage.logActivity('🔧', 'room_status', `Room **${room.number}** status set to **${statusLabels[newStatus]}**`);
    
    await refreshData();
  };

  const deleteRoom = async (roomId) => {
    if (confirm('Are you sure you want to delete this room?')) {
      await storage.delete(STORAGE_KEYS.ROOMS, roomId);
      await refreshData();
    }
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ev.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Room Management</h2>
          <p className="subtitle">{rooms.length} rooms • {rooms.filter(r => r.status === 'vacant').length} vacant</p>
        </div>
        <div className="page-actions">
          <div className="tabs" style={{ marginBottom: 0, width: 'auto' }}>
            <button className={`tab ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>▦ Grid</button>
            <button className={`tab ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰ List</button>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>+ Add Room</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ width: 250 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search rooms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="filter-chips">
          {['all', 'occupied', 'vacant', 'maintenance'].map(status => (
            <button key={status} className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}>
              {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          {['all', 'Single', 'Double', 'Triple'].map(type => (
            <button key={type} className={`filter-chip ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}>
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid-auto">
          {filteredRooms.map((room) => {
            const roomGuests = guests.filter(g => g.roomId === room.id && g.status === 'active');
            const capacity = room.type === 'Single' ? 1 : room.type === 'Double' ? 2 : room.type === 'Triple' ? 3 : 1;
            const isFull = roomGuests.length >= capacity;
            
            let sc = { label: 'Vacant', color: 'success', icon: '🟢' };
            if (room.status === 'maintenance') {
              sc = { label: 'Maintenance', color: 'warning', icon: '🔧' };
            } else if (isFull) {
              sc = { label: 'Occupied', color: 'danger', icon: '🔴' };
            } else if (roomGuests.length > 0) {
              sc = { label: `${roomGuests.length}/${capacity} Filled`, color: 'info', icon: '🔵' };
            }
            return (
              <div key={room.id} className="room-card">
                <div className="room-card-image">
                  {room.images?.length > 0 ? (
                    <img src={room.images[0]} alt={`Room ${room.number}`} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))' }}>
                      🚪
                    </div>
                  )}
                  <div className="room-status">
                    <span className={`badge badge-${sc?.color || 'neutral'}`}>
                      {sc?.icon} {sc?.label}
                    </span>
                  </div>
                  <div className="room-type">{room.type}</div>
                </div>
                <div className="room-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0 }}>Room {room.number}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Floor {room.floor}</span>
                  </div>

                  {/* Bed Occupancy Icons Visualization */}
                  <div style={{
                    marginTop: 'var(--space-md)',
                    marginBottom: 'var(--space-md)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Beds & Occupants
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'space-around', alignItems: 'flex-start' }}>
                      {Array.from({ length: capacity }).map((_, idx) => {
                        const occupant = roomGuests[idx];
                        const isOccupied = !!occupant;
                        const bedColor = isOccupied ? '#ef4444' : '#10b981'; // vibrant red and green
                        const bgLight = isOccupied ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)';
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '38px',
                              height: '38px',
                              borderRadius: 'var(--radius-md)',
                              background: bgLight,
                              marginBottom: '6px',
                              border: `1px solid ${isOccupied ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                              transition: 'transform 0.2s',
                            }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill={bedColor} style={{ display: 'block' }}>
                                <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
                              </svg>
                            </div>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: isOccupied ? 'var(--text-primary)' : 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%',
                              padding: '0 2px',
                            }} title={occupant ? occupant.name : 'Vacant'}>
                              {occupant ? occupant.name.split(' ')[0] : 'Vacant'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="room-price" style={{ marginTop: 'var(--space-sm)' }}>
                    {formatCurrency(room.rent)} <span>/month</span>
                  </div>
                  <div className="room-amenities" style={{ marginTop: 'var(--space-sm)' }}>
                    {(room.amenities || []).slice(0, 3).map((a, i) => (
                      <span key={i} className="amenity-chip">{AMENITY_ICONS[a] || '•'} {a.replace('_', ' ')}</span>
                    ))}
                    {(room.amenities?.length || 0) > 3 && <span className="amenity-chip">+{room.amenities.length - 3}</span>}
                  </div>
                </div>
                <div className="room-card-footer">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(room)}>✏️ Edit</button>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(room)}
                      title="Toggle maintenance" disabled={roomGuests.length > 0}>🔄</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteRoom(room.id)}
                      style={{ color: 'var(--danger)' }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Rent</th>
                <th>Status</th>
                <th>Guest</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => {
                const roomGuests = guests.filter(g => g.roomId === room.id && g.status === 'active');
                const capacity = room.type === 'Single' ? 1 : room.type === 'Double' ? 2 : room.type === 'Triple' ? 3 : 1;
                const isFull = roomGuests.length >= capacity;
                
                let sc = { label: 'Vacant', color: 'success', icon: '🟢' };
                if (room.status === 'maintenance') {
                  sc = { label: 'Maintenance', color: 'warning', icon: '🔧' };
                } else if (isFull) {
                  sc = { label: 'Occupied', color: 'danger', icon: '🔴' };
                } else if (roomGuests.length > 0) {
                  sc = { label: `${roomGuests.length}/${capacity} Filled`, color: 'info', icon: '🔵' };
                }
                return (
                  <tr key={room.id}>
                    <td className="cell-primary">Room {room.number}</td>
                    <td>{room.type}</td>
                    <td>Floor {room.floor}</td>
                    <td className="cell-primary">{formatCurrency(room.rent)}</td>
                    <td><span className={`badge badge-${sc?.color}`}>{sc?.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {Array.from({ length: capacity }).map((_, idx) => {
                            const occupant = roomGuests[idx];
                            const isOccupied = !!occupant;
                            const bedColor = isOccupied ? '#ef4444' : '#10b981';
                            return (
                              <svg key={idx} width="16" height="16" viewBox="0 0 24 24" fill={bedColor} title={occupant ? occupant.name : 'Vacant'}>
                                <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
                              </svg>
                            );
                          })}
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>
                          {roomGuests.length > 0 ? roomGuests.map(g => g.name.split(' ')[0]).join(', ') : '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(room)}>✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => deleteRoom(room.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredRooms.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚪</div>
          <h3>No rooms found</h3>
          <p>Try adjusting your filters or add a new room.</p>
          <button className="btn btn-primary" onClick={openAddModal}>+ Add Room</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Number *</label>
                  <input type="text" className="form-input" placeholder="e.g., 101" value={formData.number}
                    onChange={(e) => setFormData(p => ({ ...p, number: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Floor</label>
                  <select className="form-select" value={formData.floor}
                    onChange={(e) => setFormData(p => ({ ...p, floor: Number(e.target.value) }))}>
                    {[1, 2, 3, 4, 5].map(f => <option key={f} value={f}>Floor {f}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Type</label>
                  <select className="form-select" value={formData.type}
                    onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}>
                    <option value="Single">Single</option>
                    <option value="Double">Double Sharing</option>
                    <option value="Triple">Triple Sharing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Rent (₹) *</label>
                  <input type="number" className="form-input" placeholder="e.g., 8500" value={formData.rent}
                    onChange={(e) => setFormData(p => ({ ...p, rent: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Security Deposit (₹)</label>
                <input type="number" className="form-input" placeholder="Default: 2x rent" value={formData.deposit}
                  onChange={(e) => setFormData(p => ({ ...p, deposit: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Room description..." value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} />
              </div>

              {/* Amenities */}
              <div className="form-group">
                <label className="form-label">Amenities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.entries(AMENITY_ICONS).map(([key, icon]) => (
                    <button key={key} type="button"
                      className={`filter-chip ${formData.amenities.includes(key) ? 'active' : ''}`}
                      onClick={() => toggleAmenity(key)}>
                      {icon} {key.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">Room Images</label>
                <div className="image-uploader" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon">📸</div>
                  <div className="upload-text">
                    <span>Click to upload</span> or drag and drop
                  </div>
                  <div className="upload-hint">PNG, JPG up to 5MB each</div>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" multiple
                    onChange={handleImageUpload} />
                </div>
                {formData.images.length > 0 && (
                  <div className="image-preview-grid">
                    {formData.images.map((img, i) => (
                      <div key={i} className="image-preview-item">
                        <img src={img} alt={`Preview ${i}`} />
                        <button className="remove-btn" onClick={() => removeImage(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingRoom ? 'Save Changes' : 'Add Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
