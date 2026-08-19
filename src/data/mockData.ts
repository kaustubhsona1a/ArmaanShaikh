import { Car, Fuel, Gauge, Calendar, ShieldCheck, Banknote, History, Zap, Settings, Star } from 'lucide-react';

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'Electric';
  transmission: 'Manual' | 'Automatic';
  engine: string;
  color: string;
  ownership: string; // 1st Owner, 2nd Owner
  registration: string;
  images: string[];
  features: string[];
  status: 'Available' | 'Sold' | 'Booked' | 'Deleted';
  description?: string;
  instagramReel?: string;
  updatedAt?: number;
  deleted?: boolean;
};

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "porsche_911_gt3_rs",
    make: "Porsche",
    model: "911 GT3 RS",
    variant: "4.0 Weissach Package",
    year: 2023,
    price: 38500000,
    mileage: 4200,
    fuelType: "Petrol",
    transmission: "Automatic",
    engine: "4.0L Naturally Aspirated Flat-6 (518 HP)",
    color: "Lizard Green / Carbon Accent",
    ownership: "1st Owner",
    registration: "MH-01-EE-9000",
    images: ["https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800"],
    features: ["Weissach Package", "Carbon Ceramic Brakes (PCCB)", "Rear Axle Steering", "Front Axle Lift System", "Magnesium Racing Wheels", "Club Sport Package"],
    status: "Available",
    description: "A road-legal track masterpiece. This Lizard Green 911 GT3 RS features the highly sought-after Weissach Package, reducing weight and enhancing aerodynamics. Immaculately maintained by a single enthusiast collector with complete Porsche Mumbai center records.",
    updatedAt: Date.now(),
    deleted: false
  },
  {
    id: "mercedes_g63_amg",
    make: "Mercedes-Benz",
    model: "G63 AMG",
    variant: "V8 Bi-Turbo Edition 55",
    year: 2022,
    price: 26500000,
    mileage: 12000,
    fuelType: "Petrol",
    transmission: "Automatic",
    engine: "4.0L Twin-Turbo V8 (577 HP)",
    color: "Matte Obsidian Black",
    ownership: "1st Owner",
    registration: "MH-02-FN-1111",
    images: ["https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?auto=format&fit=crop&q=80&w=800"],
    features: ["AMG Night Package", "22-inch Forged AMG Wheels", "Burmester Surround Sound System", "Bespoke Nappa Leather Concept", "Dynamic Ride Control Active Suspension", "Red Brake Calipers"],
    status: "Available",
    description: "The ultimate power statement. Obsidian Black metallic exterior combined with red/black bi-color Nappa leather. Complete company service records, absolute showroom condition.",
    updatedAt: Date.now(),
    deleted: false
  },
  {
    id: "range_rover_autobio",
    make: "Land Rover",
    model: "Range Rover",
    variant: "3.0 LWB Autobiography (D350)",
    year: 2021,
    price: 19500000,
    mileage: 24000,
    fuelType: "Diesel",
    transmission: "Automatic",
    engine: "3.0L twin-turbocharged inline-6 Diesel (346 HP)",
    color: "Belgravia Green Metallic",
    ownership: "1st Owner",
    registration: "MH-47-AA-0300",
    images: ["https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=800"],
    features: ["Executive Class Rear Seating", "Meridian Signature Sound System (1600W)", "Panoramic Sliding Sunroof", "Laser LED Headlights", "Cabin Air Purification Pro", "24-Way Heated & Cooled Massage Seats"],
    status: "Available",
    description: "Unrivaled luxury and off-road capability. Belgravia Green exterior with semi-aniline Perlino leather interior. Serviced strictly at Land Rover authorized workshops in Mumbai.",
    updatedAt: Date.now(),
    deleted: false
  }
];

export const MOCK_REVIEWS = [
  {
    id: 1,
    name: "Mahesh Kulkarni",
    rating: 5,
    text: "Purchased a certified 2021 Hyundai Grand i10 Nios for my daily commute to BKC and family weekend trips. The car was in mint mechanical condition with original paint. Bombay Motors handled the Mulund RTO transfer in just 4 days with complete honesty and zero agent hassles.",
    date: "Mulund West • 3 weeks ago"
  },
  {
    id: 2,
    name: "Pooja & Shrikant Sawant",
    rating: 5,
    text: "We were looking for a reliable, genuine family car on a strict middle-class budget and found a clean 2020 Maruti Suzuki Swift VXi here. Exact odometer reading, clean service book from authorized workshop, and very polite guidance by the team. Highly recommended for Eastern Suburbs families!",
    date: "Thane West • 1 month ago"
  },
  {
    id: 3,
    name: "Siddhesh Bhandare",
    rating: 5,
    text: "Got a verified 2022 Hyundai Venue SX for our family. Full transparency on chassis check, battery health, and test drive through LBS Marg. Transparent pricing without any hidden dealer commissions. Truly Mumbai's most dependable pre-owned car showroom.",
    date: "Ghatkopar East • 2 months ago"
  },
  {
    id: 4,
    name: "Nitin Kadam",
    rating: 5,
    text: "Bought a 2019 Maruti Baleno Zeta. Bombay Motors team guided us patiently through finance options and transferred the insurance seamlessly. Clean car, fair valuation for my old Alto exchange, and absolute peace of mind for daily office drive.",
    date: "Bhandup West • 2 weeks ago"
  }
];

export const MOCK_LEADS = [
  { id: 'l1', name: 'Sanjay Gupta', phone: '9876543210', email: 'sanjay@example.com', car: 'Hyundai Creta', status: 'New Lead', date: '2026-06-05' },
  { id: 'l2', name: 'Neha Singh', phone: '9988776655', email: 'neha@example.com', car: 'Honda City', status: 'Contacted', date: '2026-06-04' },
  { id: 'l3', name: 'Vikram Joshi', phone: '9123456789', email: 'vikram@example.com', car: 'Kia Seltos', status: 'Negotiating', date: '2026-06-02' }
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
};
