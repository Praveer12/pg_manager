-- Supabase Setup Script for PG Manager (FIXED for camelCase columns)
-- Please delete any existing tables before running this script.
-- Copy and paste this into the Supabase SQL Editor and hit "Run"

-- 1. Create Users Table
CREATE TABLE pgm_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Properties Table
CREATE TABLE pgm_properties (
  id TEXT PRIMARY KEY,
  "ownerId" TEXT REFERENCES pgm_users(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  "totalRooms" INTEGER,
  amenities JSONB,
  rules JSONB,
  "paymentDetails" JSONB,
  rating NUMERIC,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Rooms Table
CREATE TABLE pgm_rooms (
  id TEXT PRIMARY KEY,
  "propertyId" TEXT REFERENCES pgm_properties(id),
  number TEXT NOT NULL,
  type TEXT NOT NULL,
  floor TEXT,
  rent NUMERIC NOT NULL,
  deposit NUMERIC NOT NULL,
  status TEXT DEFAULT 'vacant',
  amenities JSONB,
  images JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Guests Table
CREATE TABLE pgm_guests (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES pgm_users(id),
  "roomId" TEXT REFERENCES pgm_rooms(id),
  "propertyId" TEXT REFERENCES pgm_properties(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  "idType" TEXT,
  "idNumber" TEXT,
  "idDocument" TEXT,
  "emergencyName" TEXT,
  "emergencyContact" TEXT,
  occupation TEXT,
  company TEXT,
  "joinDate" DATE,
  "leaveDate" DATE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Payments Table
CREATE TABLE pgm_payments (
  id TEXT PRIMARY KEY,
  "guestId" TEXT REFERENCES pgm_guests(id),
  "roomId" TEXT REFERENCES pgm_rooms(id),
  "propertyId" TEXT REFERENCES pgm_properties(id),
  amount NUMERIC NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  "dueDate" DATE,
  "paidDate" DATE,
  method TEXT,
  "receiptNo" TEXT,
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Agreements Table
CREATE TABLE pgm_agreements (
  id TEXT PRIMARY KEY,
  "guestId" TEXT REFERENCES pgm_guests(id),
  "roomId" TEXT REFERENCES pgm_rooms(id),
  "propertyId" TEXT REFERENCES pgm_properties(id),
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  rent NUMERIC NOT NULL,
  deposit NUMERIC NOT NULL,
  "depositPaid" BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  type TEXT DEFAULT 'monthly',
  "documentUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Maintenance Table
CREATE TABLE pgm_maintenance (
  id TEXT PRIMARY KEY,
  "guestId" TEXT REFERENCES pgm_guests(id),
  "roomId" TEXT REFERENCES pgm_rooms(id),
  "propertyId" TEXT REFERENCES pgm_properties(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new',
  images JSONB,
  "assignedTo" TEXT,
  "resolvedDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Notices Table
CREATE TABLE pgm_notices (
  id TEXT PRIMARY KEY,
  "ownerId" TEXT REFERENCES pgm_users(id),
  "propertyId" TEXT REFERENCES pgm_properties(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  pinned BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Booking Requests Table
CREATE TABLE pgm_booking_requests (
  id TEXT PRIMARY KEY,
  "roomId" TEXT REFERENCES pgm_rooms(id),
  "propertyId" TEXT REFERENCES pgm_properties(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  "moveInDate" DATE,
  "stayType" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- DISABLE ROW LEVEL SECURITY TEMPORARILY FOR EASY SETUP (can be enabled later for production)
ALTER TABLE pgm_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE pgm_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE pgm_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE pgm_guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE pgm_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE pgm_agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE pgm_maintenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE pgm_notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE pgm_booking_requests DISABLE ROW LEVEL SECURITY;
