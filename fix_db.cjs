require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fix() {
  console.log('Fetching data...');
  const { data: guests } = await supabase.from('pgm_guests').select('*');
  const { data: rooms } = await supabase.from('pgm_rooms').select('*');
  const { data: agreements } = await supabase.from('pgm_agreements').select('*');
  const { data: maintenance } = await supabase.from('pgm_maintenance').select('*');

  if (!guests) {
    console.log('No guests found in DB or DB error.');
    return;
  }

  const checkedOutGuests = guests.filter(g => g.status === 'checked_out');
  for (const guest of checkedOutGuests) {
    const agrs = agreements.filter(a => a.guestId === guest.id && (a.status === 'active' || a.status === 'expiring'));
    for (const agr of agrs) {
      console.log('Expiring agreement', agr.id);
      await supabase.from('pgm_agreements').update({ status: 'expired' }).eq('id', agr.id);
    }
  }

  const activeGuests = guests.filter(g => g.status === 'active');
  const activeMaintenance = maintenance ? maintenance.filter(m => m.status !== 'resolved') : [];

  for (const room of rooms) {
    const roomGuests = activeGuests.filter(g => g.roomId === room.id);
    const hasMaintenance = activeMaintenance.some(m => m.roomId === room.id);
    const capacity = room.type === 'Single' ? 1 : room.type === 'Double' ? 2 : room.type === 'Triple' ? 3 : 1;

    let expectedStatus = roomGuests.length >= capacity ? 'occupied' : 'vacant';
    if (hasMaintenance) expectedStatus = 'maintenance';

    if (room.status !== expectedStatus) {
      console.log('Fixing room', room.number, 'from', room.status, 'to', expectedStatus);
      await supabase.from('pgm_rooms').update({ status: expectedStatus }).eq('id', room.id);
    }
  }
  console.log('Done!');
}
fix();
