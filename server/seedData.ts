export interface RoleSeed {
  role_name: string;
  description: string;
}

export interface UserSeed {
  name: string;
  email: string;
  username: string;
  password: string;
  avatar_url: string;
  is_active: boolean;
  role_name: string;
}

export interface GreenSpaceSeed {
  name: string;
  location: string;
  total_area_m2: number;
  trees_count: number;
  images: string[];
}

export const roleSeeds: RoleSeed[] = [
  {
    role_name: "admin",
    description: "System administrator",
  },
  {
    role_name: "regular",
    description: "Regular platform user",
  },
];

export const userSeeds: UserSeed[] = [
  {
    name: "Admin User",
    email: "admin@greenmetric.local",
    username: "admin",
    password: "admin123",
    avatar_url: "",
    is_active: true,
    role_name: "admin",
  },
  {
    name: "Regular User",
    email: "user@greenmetric.local",
    username: "regular.user",
    password: "user123",
    avatar_url: "",
    is_active: true,
    role_name: "regular",
  },
];

export const greenSpaceSeeds: GreenSpaceSeed[] = [
  {
    name: "Jardín Central",
    location: "Frente a la Biblioteca",
    total_area_m2: 5400,
    trees_count: 120,
    images: [
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Bosque Universitario",
    location: "Sector Norte del campus",
    total_area_m2: 7200,
    trees_count: 180,
    images: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Patio Verde del Rectorado",
    location: "Al lado del edificio administrativo",
    total_area_m2: 2800,
    trees_count: 72,
    images: [
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502085671122-2d218cd434e6?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Parque de la Facultad",
    location: "Entre bloques A y B",
    total_area_m2: 3900,
    trees_count: 94,
    images: [
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Área de descanso Estudiantil",
    location: "Cerca del centro de estudiantes",
    total_area_m2: 2300,
    trees_count: 48,
    images: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Sendero Verde",
    location: "Ruta peatonal del campus",
    total_area_m2: 3100,
    trees_count: 68,
    images: [
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502085671122-2d218cd434e6?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];
