// Seed data & localStorage initialization
import { STORAGE_KEYS, generateId } from '../utils/storage.js';

const DEMO_OWNER = {
  id: 'owner_001',
  name: 'Rajesh Kumar',
  email: 'owner@pgmanager.com',
  phone: '9876543210',
  role: 'owner',
  password: 'owner123',
  avatar: null,
  createdAt: '2025-01-15T10:00:00Z',
};

const DEMO_TENANT = {
  id: 'tenant_001',
  name: 'Priya Sharma',
  email: 'tenant@pgmanager.com',
  phone: '9876543211',
  role: 'tenant',
  password: 'tenant123',
  avatar: null,
  createdAt: '2025-03-01T10:00:00Z',
};

const DEMO_PROPERTIES = [
  {
    id: 'prop_001',
    ownerId: 'owner_001',
    name: 'Sunrise PG Residency',
    address: '42, MG Road, Koramangala, Bangalore - 560034',
    city: 'Bangalore',
    type: 'Co-Living',
    totalRooms: 12,
    amenities: ['wifi', 'ac', 'parking', 'laundry', 'kitchen', 'security', 'cctv', 'power_backup', 'water_purifier', 'housekeeping'],
    description: 'Premium PG accommodation in the heart of Koramangala with modern amenities and comfortable living spaces.',
    rules: ['No smoking inside rooms', 'Visitor hours: 9 AM - 9 PM', 'Maintain silence after 10 PM', 'No pets allowed'],
    rating: 4.5,
    images: [],
    paymentDetails: {
      upiId: 'owner@okaxis',
      upiPhone: '9876543210',
      qrImage: null,
    },
    createdAt: '2025-01-15T10:00:00Z',
  },
];

const DEMO_ROOMS = [
  { id: 'room_001', propertyId: 'prop_001', number: '101', floor: 1, type: 'Single', rent: 8500, deposit: 17000, status: 'occupied', amenities: ['ac', 'attached_bath', 'wardrobe', 'study_table', 'wifi'], description: 'Spacious single room with attached bathroom and balcony view.', images: [], guestId: 'guest_001', createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_002', propertyId: 'prop_001', number: '102', floor: 1, type: 'Double', rent: 6500, deposit: 13000, status: 'occupied', amenities: ['ac', 'attached_bath', 'wardrobe', 'study_table', 'wifi'], description: 'Comfortable double sharing room with modern furnishings.', images: [], guestId: 'guest_002', createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_003', propertyId: 'prop_001', number: '103', floor: 1, type: 'Triple', rent: 5000, deposit: 10000, status: 'occupied', amenities: ['fan', 'common_bath', 'wardrobe', 'wifi'], description: 'Affordable triple sharing room with good ventilation.', images: [], guestId: 'guest_003', createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_004', propertyId: 'prop_001', number: '201', floor: 2, type: 'Single', rent: 9000, deposit: 18000, status: 'vacant', amenities: ['ac', 'attached_bath', 'wardrobe', 'study_table', 'wifi', 'balcony'], description: 'Premium single room on second floor with city view balcony.', images: [], guestId: null, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_005', propertyId: 'prop_001', number: '202', floor: 2, type: 'Double', rent: 7000, deposit: 14000, status: 'occupied', amenities: ['ac', 'attached_bath', 'wardrobe', 'study_table', 'wifi'], description: 'Well-furnished double room with ample storage space.', images: [], guestId: 'guest_004', createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_006', propertyId: 'prop_001', number: '203', floor: 2, type: 'Single', rent: 8500, deposit: 17000, status: 'maintenance', amenities: ['ac', 'attached_bath', 'wardrobe', 'study_table', 'wifi'], description: 'Single room currently under renovation for upgrades.', images: [], guestId: null, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_007', propertyId: 'prop_001', number: '301', floor: 3, type: 'Double', rent: 6500, deposit: 13000, status: 'vacant', amenities: ['fan', 'attached_bath', 'wardrobe', 'wifi'], description: 'Budget-friendly double room on top floor with terrace access.', images: [], guestId: null, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_008', propertyId: 'prop_001', number: '302', floor: 3, type: 'Single', rent: 9500, deposit: 19000, status: 'occupied', amenities: ['ac', 'attached_bath', 'wardrobe', 'study_table', 'wifi', 'balcony', 'tv'], description: 'Premium deluxe single room with TV and private balcony.', images: [], guestId: 'guest_005', createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_009', propertyId: 'prop_001', number: '303', floor: 3, type: 'Triple', rent: 4500, deposit: 9000, status: 'occupied', amenities: ['fan', 'common_bath', 'wardrobe', 'wifi'], description: 'Economical triple sharing with shared bathroom.', images: [], guestId: 'guest_006', createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_010', propertyId: 'prop_001', number: '104', floor: 1, type: 'Double', rent: 7000, deposit: 14000, status: 'vacant', amenities: ['ac', 'attached_bath', 'wardrobe', 'study_table', 'wifi'], description: 'Ground floor double room with garden view.', images: [], guestId: null, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_011', propertyId: 'prop_001', number: '204', floor: 2, type: 'Single', rent: 8000, deposit: 16000, status: 'occupied', amenities: ['ac', 'attached_bath', 'wardrobe', 'wifi'], description: 'Compact single room ideal for working professionals.', images: [], guestId: 'guest_007', createdAt: '2025-01-15T10:00:00Z' },
  { id: 'room_012', propertyId: 'prop_001', number: '304', floor: 3, type: 'Double', rent: 6000, deposit: 12000, status: 'vacant', amenities: ['fan', 'common_bath', 'wardrobe', 'wifi'], description: 'Cozy double room with natural lighting.', images: [], guestId: null, createdAt: '2025-01-15T10:00:00Z' },
];

const DEMO_GUESTS = [
  { id: 'guest_001', userId: 'tenant_001', name: 'Priya Sharma', email: 'priya@email.com', phone: '9876543211', emergencyContact: '9876543299', emergencyName: 'Mohan Sharma', roomId: 'room_001', propertyId: 'prop_001', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-1234', occupation: 'Software Engineer', company: 'TCS', joinDate: '2025-03-01', checkoutDate: null, status: 'active', createdAt: '2025-03-01T10:00:00Z' },
  { id: 'guest_002', name: 'Amit Patel', email: 'amit@email.com', phone: '9876543212', emergencyContact: '9876543298', emergencyName: 'Ravi Patel', roomId: 'room_002', propertyId: 'prop_001', idType: 'PAN', idNumber: 'ABCDE1234F', occupation: 'Data Analyst', company: 'Infosys', joinDate: '2025-02-15', checkoutDate: null, status: 'active', createdAt: '2025-02-15T10:00:00Z' },
  { id: 'guest_002b', name: 'Rohan Desai', email: 'rohan@email.com', phone: '9876543230', emergencyContact: '9876543280', emergencyName: 'Sunil Desai', roomId: 'room_002', propertyId: 'prop_001', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-7890', occupation: 'Software Developer', company: 'Wipro', joinDate: '2025-03-10', checkoutDate: null, status: 'active', createdAt: '2025-03-10T10:00:00Z' },
  { id: 'guest_003', name: 'Sneha Reddy', email: 'sneha@email.com', phone: '9876543213', emergencyContact: '9876543297', emergencyName: 'Lakshmi Reddy', roomId: 'room_003', propertyId: 'prop_001', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-5678', occupation: 'Student', company: 'IIT Bangalore', joinDate: '2025-04-01', checkoutDate: null, status: 'active', createdAt: '2025-04-01T10:00:00Z' },
  { id: 'guest_003b', name: 'Divya Nair', email: 'divya@email.com', phone: '9876543231', emergencyContact: '9876543281', emergencyName: 'Rekha Nair', roomId: 'room_003', propertyId: 'prop_001', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-2345', occupation: 'Student', company: 'IIT Bangalore', joinDate: '2025-04-05', checkoutDate: null, status: 'active', createdAt: '2025-04-05T10:00:00Z' },
  { id: 'guest_003c', name: 'Meera Iyer', email: 'meera.i@email.com', phone: '9876543232', emergencyContact: '9876543282', emergencyName: 'Srinivas Iyer', roomId: 'room_003', propertyId: 'prop_001', idType: 'PAN', idNumber: 'KLMNO6789P', occupation: 'Student', company: 'IIT Bangalore', joinDate: '2025-04-10', checkoutDate: null, status: 'active', createdAt: '2025-04-10T10:00:00Z' },
  { id: 'guest_004', name: 'Vikram Singh', email: 'vikram@email.com', phone: '9876543214', emergencyContact: '9876543296', emergencyName: 'Deepak Singh', roomId: 'room_005', propertyId: 'prop_001', idType: 'Driving License', idNumber: 'KA-0120250001', occupation: 'Marketing Manager', company: 'Flipkart', joinDate: '2025-01-20', checkoutDate: null, status: 'active', createdAt: '2025-01-20T10:00:00Z' },
  { id: 'guest_004b', name: 'Arjun Kapoor', email: 'arjun.k@email.com', phone: '9876543233', emergencyContact: '9876543283', emergencyName: 'Raj Kapoor', roomId: 'room_005', propertyId: 'prop_001', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-6789', occupation: 'Sales Executive', company: 'Amazon', joinDate: '2025-02-01', checkoutDate: null, status: 'active', createdAt: '2025-02-01T10:00:00Z' },
  { id: 'guest_005', name: 'Neha Gupta', email: 'neha@email.com', phone: '9876543215', emergencyContact: '9876543295', emergencyName: 'Suresh Gupta', roomId: 'room_008', propertyId: 'prop_001', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-9012', occupation: 'UX Designer', company: 'Google', joinDate: '2025-05-01', checkoutDate: null, status: 'active', createdAt: '2025-05-01T10:00:00Z' },
  { id: 'guest_006', name: 'Rahul Mehra', email: 'rahul@email.com', phone: '9876543216', emergencyContact: '9876543294', emergencyName: 'Anita Mehra', roomId: 'room_009', propertyId: 'prop_001', idType: 'PAN', idNumber: 'FGHIJ5678K', occupation: 'Freelancer', company: 'Self-Employed', joinDate: '2025-03-15', checkoutDate: null, status: 'active', createdAt: '2025-03-15T10:00:00Z' },
  { id: 'guest_006b', name: 'Karan Malhotra', email: 'karan@email.com', phone: '9876543234', emergencyContact: '9876543284', emergencyName: 'Sanjay Malhotra', roomId: 'room_009', propertyId: 'prop_001', idType: 'Driving License', idNumber: 'KA-0120250099', occupation: 'Graphic Designer', company: 'Self-Employed', joinDate: '2025-03-20', checkoutDate: null, status: 'active', createdAt: '2025-03-20T10:00:00Z' },
  { id: 'guest_006c', name: 'Siddharth Rao', email: 'sid@email.com', phone: '9876543235', emergencyContact: '9876543285', emergencyName: 'Venkat Rao', roomId: 'room_009', propertyId: 'prop_001', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-4567', occupation: 'Content Writer', company: 'Freelance', joinDate: '2025-04-01', checkoutDate: null, status: 'active', createdAt: '2025-04-01T10:00:00Z' },
  { id: 'guest_007', name: 'Kavita Joshi', email: 'kavita@email.com', phone: '9876543217', emergencyContact: '9876543293', emergencyName: 'Prakash Joshi', roomId: 'room_011', propertyId: 'prop_001', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-3456', occupation: 'Accountant', company: 'Deloitte', joinDate: '2025-04-15', checkoutDate: null, status: 'active', createdAt: '2025-04-15T10:00:00Z' },
];

const DEMO_AGREEMENTS = [
  { id: 'agr_001', guestId: 'guest_001', roomId: 'room_001', propertyId: 'prop_001', type: 'Annual', startDate: '2025-03-01', endDate: '2026-02-28', rent: 8500, deposit: 17000, depositPaid: true, status: 'active', terms: 'Standard annual agreement with 1-month notice period.', createdAt: '2025-03-01T10:00:00Z' },
  { id: 'agr_002', guestId: 'guest_002', roomId: 'room_002', propertyId: 'prop_001', type: 'Semi-Annual', startDate: '2025-02-15', endDate: '2025-08-14', rent: 6500, deposit: 13000, depositPaid: true, status: 'active', terms: '6-month agreement.', createdAt: '2025-02-15T10:00:00Z' },
  { id: 'agr_003', guestId: 'guest_003', roomId: 'room_003', propertyId: 'prop_001', type: 'Monthly', startDate: '2025-04-01', endDate: '2025-07-01', rent: 5000, deposit: 10000, depositPaid: true, status: 'active', terms: 'Month-to-month with 15-day notice.', createdAt: '2025-04-01T10:00:00Z' },
  { id: 'agr_004', guestId: 'guest_004', roomId: 'room_005', propertyId: 'prop_001', type: 'Annual', startDate: '2025-01-20', endDate: '2026-01-19', rent: 7000, deposit: 14000, depositPaid: true, status: 'active', terms: 'Annual agreement with auto-renewal clause.', createdAt: '2025-01-20T10:00:00Z' },
  { id: 'agr_005', guestId: 'guest_005', roomId: 'room_008', propertyId: 'prop_001', type: 'Quarterly', startDate: '2025-05-01', endDate: '2025-07-31', rent: 9500, deposit: 19000, depositPaid: true, status: 'active', terms: '3-month agreement.', createdAt: '2025-05-01T10:00:00Z' },
  { id: 'agr_006', guestId: 'guest_006', roomId: 'room_009', propertyId: 'prop_001', type: 'Monthly', startDate: '2025-03-15', endDate: '2025-06-15', rent: 4500, deposit: 9000, depositPaid: true, status: 'expiring', terms: 'Month-to-month agreement.', createdAt: '2025-03-15T10:00:00Z' },
  { id: 'agr_007', guestId: 'guest_007', roomId: 'room_011', propertyId: 'prop_001', type: 'Semi-Annual', startDate: '2025-04-15', endDate: '2025-10-14', rent: 8000, deposit: 16000, depositPaid: true, status: 'active', terms: '6-month agreement with renewal option.', createdAt: '2025-04-15T10:00:00Z' },
];

function generatePaymentHistory() {
  const payments = [];
  const guests = DEMO_GUESTS;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  
  const months = [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  for (let i = 4; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), currentMonthIndex - i, 1);
    months.push({
      month: monthNames[targetDate.getMonth()],
      year: targetDate.getFullYear(),
      date: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-05`
    });
  }

  const methods = ['UPI', 'Cash', 'Bank Transfer', 'UPI'];
  
  guests.forEach((guest) => {
    const agreement = DEMO_AGREEMENTS.find(a => a.guestId === guest.id);
    if (!agreement) return;
    
    const guestJoinDate = new Date(guest.joinDate);
    
    months.forEach((m, mi) => {
      const monthIndex = monthNames.indexOf(m.month);
      const paymentDate = new Date(m.year, monthIndex, 1);
      const joinYearMonth = new Date(guestJoinDate.getFullYear(), guestJoinDate.getMonth(), 1);
      if (paymentDate < joinYearMonth) return;
      
      const isPaid = mi < 4; // The first 4 months of rolling are paid, the 5th (latest) is pending
      payments.push({
        id: `pay_${guest.id}_${mi}`,
        guestId: guest.id,
        roomId: guest.roomId,
        propertyId: 'prop_001',
        amount: agreement.rent,
        month: m.month,
        year: m.year,
        dueDate: `${m.year}-${String(monthIndex + 1).padStart(2, '0')}-05`,
        paidDate: isPaid ? `${m.year}-${String(monthIndex + 1).padStart(2, '0')}-0${3 + Math.floor(Math.random() * 3)}` : null,
        method: isPaid ? methods[Math.floor(Math.random() * methods.length)] : null,
        status: isPaid ? 'paid' : (mi === 4 ? 'pending' : 'overdue'),
        receiptNo: isPaid ? `RCP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` : null,
        notes: '',
        createdAt: m.date + 'T10:00:00Z',
      });
    });
  });

  return payments;
}

const DEMO_MAINTENANCE = [
  { id: 'mnt_001', guestId: 'guest_001', roomId: 'room_001', propertyId: 'prop_001', category: 'Plumbing', title: 'Bathroom tap leaking', description: 'The hot water tap in the bathroom is continuously dripping.', priority: 'high', status: 'in_progress', images: [], assignedTo: 'Ramu (Plumber)', createdAt: '2025-05-20T10:00:00Z', updatedAt: '2025-05-21T14:00:00Z' },
  { id: 'mnt_002', guestId: 'guest_003', roomId: 'room_003', propertyId: 'prop_001', category: 'Electrical', title: 'Fan not working', description: 'Ceiling fan in the room stopped working last night.', priority: 'medium', status: 'new', images: [], assignedTo: null, createdAt: '2025-05-24T08:00:00Z', updatedAt: '2025-05-24T08:00:00Z' },
  { id: 'mnt_003', guestId: 'guest_005', roomId: 'room_008', propertyId: 'prop_001', category: 'Furniture', title: 'Wardrobe door broken', description: 'The sliding door of the wardrobe came off its track.', priority: 'low', status: 'resolved', images: [], assignedTo: 'Suresh (Carpenter)', resolvedDate: '2025-05-18T16:00:00Z', createdAt: '2025-05-15T11:00:00Z', updatedAt: '2025-05-18T16:00:00Z' },
  { id: 'mnt_004', guestId: 'guest_002', roomId: 'room_002', propertyId: 'prop_001', category: 'AC/Cooling', title: 'AC not cooling properly', description: 'Air conditioner is running but not cooling the room. Might need gas refill.', priority: 'high', status: 'new', images: [], assignedTo: null, createdAt: '2025-05-25T09:30:00Z', updatedAt: '2025-05-25T09:30:00Z' },
  { id: 'mnt_005', guestId: 'guest_006', roomId: 'room_009', propertyId: 'prop_001', category: 'Cleaning', title: 'Deep cleaning required', description: 'Request for deep cleaning of the room and bathroom.', priority: 'low', status: 'in_progress', images: [], assignedTo: 'Housekeeping Team', createdAt: '2025-05-23T07:00:00Z', updatedAt: '2025-05-24T10:00:00Z' },
];

const DEMO_NOTICES = [
  { id: 'not_001', propertyId: 'prop_001', ownerId: 'owner_001', title: 'Water Supply Interruption', content: 'Dear residents, due to municipal maintenance work, water supply will be interrupted on May 28th from 10 AM to 4 PM. Please store water in advance. We apologize for the inconvenience.', priority: 'high', pinned: true, createdAt: '2025-05-25T10:00:00Z' },
  { id: 'not_002', propertyId: 'prop_001', ownerId: 'owner_001', title: 'Monthly Get-Together 🎉', content: 'We are organizing a monthly get-together this Saturday at 7 PM in the common area. Snacks and refreshments will be provided. All residents are welcome to join!', priority: 'normal', pinned: false, createdAt: '2025-05-22T15:00:00Z' },
  { id: 'not_003', propertyId: 'prop_001', ownerId: 'owner_001', title: 'Rent Payment Reminder', content: 'Kindly ensure your rent for the month of June is paid by the 5th. Late payments will attract a penalty of ₹500. You can pay via UPI, bank transfer, or cash.', priority: 'high', pinned: true, createdAt: '2025-05-26T09:00:00Z' },
  { id: 'not_004', propertyId: 'prop_001', ownerId: 'owner_001', title: 'New WiFi Password', content: 'The WiFi password has been updated for security. New password: SunrisePG@2025. Please connect with the new password. Contact us if you face any issues.', priority: 'normal', pinned: false, createdAt: '2025-05-20T12:00:00Z' },
  { id: 'not_005', propertyId: 'prop_001', ownerId: 'owner_001', title: 'Pest Control Schedule', content: 'Pest control treatment is scheduled for May 30th, 9 AM - 12 PM. Please keep your rooms accessible and remove any food items from open surfaces.', priority: 'normal', pinned: false, createdAt: '2025-05-24T11:00:00Z' },
];

const DEMO_BOOKING_REQUESTS = [
  { id: 'bk_001', userId: 'tenant_002', name: 'Arjun Verma', email: 'arjun@email.com', phone: '9876543220', roomId: 'room_004', propertyId: 'prop_001', moveInDate: '2025-06-01', stayType: 'Annual', message: 'I am a software developer looking for a quiet single room. Interested in the premium room with balcony.', status: 'pending', createdAt: '2025-05-24T16:00:00Z' },
  { id: 'bk_002', userId: 'tenant_003', name: 'Meera Nair', email: 'meera@email.com', phone: '9876543221', roomId: 'room_007', propertyId: 'prop_001', moveInDate: '2025-06-15', stayType: 'Monthly', message: 'Student at nearby college. Looking for affordable double sharing.', status: 'pending', createdAt: '2025-05-25T11:00:00Z' },
];

const DEMO_ACTIVITIES = [
  {
    id: 'act_001',
    icon: '💰',
    type: 'payment',
    text: 'Payment of **₹8,500** recorded for **Priya Sharma** (Room 101)',
    details: 'Month: May | Method: UPI | Receipt: RCP-582049',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'act_002',
    icon: '👥',
    type: 'guest_checkin',
    text: 'New guest **Neha Gupta** checked in to **Room 302** (Single)',
    details: 'Move-in Date: 2026-05-01 | Deposit Collected: ₹19,000',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'act_003',
    icon: '🔧',
    type: 'maintenance',
    text: 'Maintenance request **"Bathroom tap leaking"** for **Room 101** set to *In Progress*',
    details: 'Assigned to: Ramu (Plumber) | Priority: High',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'act_004',
    icon: '📋',
    type: 'notice',
    text: 'Notice posted: **"Water Supply Interruption"**',
    details: 'Scheduled for May 28th, 10 AM - 4 PM. Pinned: Yes.',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(), // 1.5 days ago
    updatedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: 'act_005',
    icon: '🚪',
    type: 'room_add',
    text: 'New Room **304** (Double Sharing) added to Sunrise PG Residency',
    details: 'Monthly Rent: ₹6,000 | Deposit: ₹12,000',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'act_006',
    icon: '🚪',
    type: 'guest_checkout',
    text: 'Guest **Kavita Joshi** checked out from **Room 204**',
    details: 'Checkout Date: 2026-05-15 | Room status set to vacant',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 3600000 * 120).toISOString(),
  }
];

export function initializeMockData() {
  // If data exists, let's verify if payments need a migration (e.g. from year 2025 to 2026)
  const existingPayments = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
  if (existingPayments) {
    try {
      const parsed = JSON.parse(existingPayments);
      const hasOldPayments = parsed.some(p => Number(p.year) === 2025);
      const currentYear = new Date().getFullYear();
      if (hasOldPayments && currentYear > 2025) {
        localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Only initialize if data doesn't exist
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEMO_OWNER, DEMO_TENANT]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROPERTIES)) {
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(DEMO_PROPERTIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(DEMO_ROOMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GUESTS)) {
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(DEMO_GUESTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(generatePaymentHistory()));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AGREEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.AGREEMENTS, JSON.stringify(DEMO_AGREEMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE)) {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(DEMO_MAINTENANCE));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTICES)) {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(DEMO_NOTICES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKING_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKING_REQUESTS, JSON.stringify(DEMO_BOOKING_REQUESTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEMO_ACTIVITIES));
  }
}

export function resetMockData() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  initializeMockData();
}

export const AMENITY_ICONS = {
  wifi: '📶', ac: '❄️', parking: '🅿️', laundry: '🧺', kitchen: '🍳',
  security: '🔒', cctv: '📹', power_backup: '🔋', water_purifier: '💧',
  housekeeping: '🧹', attached_bath: '🚿', common_bath: '🛁', wardrobe: '🗄️',
  study_table: '📚', balcony: '🌅', tv: '📺', fan: '🌀', gym: '💪',
  swimming_pool: '🏊', garden: '🌿', elevator: '🛗', food: '🍽️',
};

export const ROOM_TYPE_COLORS = {
  Single: 'purple',
  Double: 'cyan',
  Triple: 'orange',
};

export const STATUS_CONFIG = {
  occupied: { label: 'Occupied', color: 'success', icon: '🟢' },
  vacant: { label: 'Vacant', color: 'info', icon: '🔵' },
  maintenance: { label: 'Maintenance', color: 'warning', icon: '🟡' },
  active: { label: 'Active', color: 'success', icon: '🟢' },
  expiring: { label: 'Expiring Soon', color: 'warning', icon: '🟡' },
  expired: { label: 'Expired', color: 'danger', icon: '🔴' },
  paid: { label: 'Paid', color: 'success', icon: '✅' },
  pending: { label: 'Pending', color: 'warning', icon: '⏳' },
  overdue: { label: 'Overdue', color: 'danger', icon: '❌' },
  new: { label: 'New', color: 'info', icon: '🆕' },
  in_progress: { label: 'In Progress', color: 'warning', icon: '🔧' },
  resolved: { label: 'Resolved', color: 'success', icon: '✅' },
};

export { DEMO_OWNER, DEMO_TENANT, STORAGE_KEYS };
