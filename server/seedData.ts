/// <reference types="node" />

import fs from "fs";
import path from "path";

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

export interface GreenSpaceReviewSeed {
  green_space_name: string;
  username: string;
  review_notes: string;
  rating: number;
  created_at: string;
}

export interface TreeTypeSeed {
  name: string;
  description: string;
  reference_images: string[];
}

export interface TreeInventorySeed {
  name: string;
  health_status: "healthy" | "regular" | "sick" | "dead";
  green_space_name: string;
  tree_type_name: string;
  image_urls: string[];
  created_at: string;
}

export interface ReportOfGreenAreaSeed {
  title: string;
  description: string;
  url_images: string[];
  state: "open" | "closed";
  username: string;
  green_space_name: string;
  created_at: string;
}

export interface ProposalSeed {
  title: string;
  description: string;
  status: "draft" | "open" | "closed" | "approved" | "rejected";
  minimum_votes_required?: number | null;
  voting_starts: string | null;
  voting_ends: string | null;
  approximate_execution_duration?: string | null;
  estimated_budget?: number | null;
  proposal_images?: string[];
  rejection_reason?: string | null;
  username: string;
  green_space_name: string;
}

export interface VoteOfProposalSeed {
  proposal_title: string;
  username: string;
  created_at: string;
}

export interface ProjectOfProposalSeed {
  title: string;
  description: string;
  completed_status: "planned" | "in_progress" | "completed";
  proposal_title: string;
  green_space_name: string;
}

export interface ProjectUpdateOfProposalSeed {
  title: string;
  description: string;
  activity_images: string[];
  project_title: string;
  username: string;
  created_at: string;
}

export interface GreenMetricRecordSeed {
  calculation_date: string;
  total_campus_area_m2: number;
  green_area_m2: number;
  campus_population: number;
  dense_vegetation_area_m2: number;
  rainwater_absorption_area_m2: number;
  sustainability_budget: number;
  conservation_operation_budget: number;
  username: string;
}

export interface FindFlowerScoreSeed {
  username: string;
  max_score: number;
  best_time_seconds: number;
  best_moves: number;
  updated_at: string;
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
  {
    name: "Daniela Torres",
    email: "daniela@greenmetric.local",
    username: "daniela.t",
    password: "user123",
    avatar_url: "",
    is_active: true,
    role_name: "regular",
  },
  {
    name: "Mateo Rios",
    email: "mateo@greenmetric.local",
    username: "mateo.rios",
    password: "user123",
    avatar_url: "",
    is_active: true,
    role_name: "regular",
  },
  {
    name: "Laura Campos",
    email: "laura@greenmetric.local",
    username: "laura.campos",
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

export const greenSpaceReviewSeeds: GreenSpaceReviewSeed[] = [
  {
    green_space_name: "Jardín Central",
    username: "regular.user",
    review_notes:
      "Excelente espacio para estudiar al aire libre. Faltan mas puntos de hidratacion.",
    rating: 4,
    created_at: "2026-08-22T11:00:00.000Z",
  },
  {
    green_space_name: "Bosque Universitario",
    username: "daniela.t",
    review_notes:
      "Muy buena sombra y biodiversidad. Algunas rutas necesitan mejor señalizacion.",
    rating: 5,
    created_at: "2026-08-24T09:20:00.000Z",
  },
  {
    green_space_name: "Parque de la Facultad",
    username: "mateo.rios",
    review_notes:
      "Area agradable, pero en horarios pico se llena rapido. Sugiero ampliar zonas de descanso.",
    rating: 4,
    created_at: "2026-08-26T17:45:00.000Z",
  },
  {
    green_space_name: "Área de descanso Estudiantil",
    username: "laura.campos",
    review_notes:
      "Buen lugar para reuniones cortas. Seria ideal agregar mas arboles de copa amplia.",
    rating: 4,
    created_at: "2026-08-29T13:10:00.000Z",
  },
  {
    green_space_name: "Sendero Verde",
    username: "admin",
    review_notes:
      "El sendero quedo limpio y transitable. Recomendable mantener jornadas de mantenimiento quincenal.",
    rating: 5,
    created_at: "2026-09-01T08:30:00.000Z",
  },
];

const fallbackTreeNames = [
  "Araguaney",
  "Apamate",
  "Flamboyan",
  "Mango",
  "Ucaro",
  "Camoruco",
  "Nispero",
];

const normalizeTreeName = (rawName: string) => {
  const cleaned = rawName.trim().replace(/[()]/g, "").replace(/\s+/g, " ");
  if (!cleaned) return "";

  const withoutAccents = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const normalized =
    withoutAccents.charAt(0).toUpperCase() +
    withoutAccents.slice(1).toLowerCase();

  return normalized;
};

const readCommonTreeNames = () => {
  const filename = path.resolve(process.cwd(), "common_trees.txt");

  try {
    const content = fs.readFileSync(filename, "utf8");
    // Extract tree names from the content using a regular expression
    const matches =
      content.match(
        /Araguaney|Apamate|Flamboy[a-zA-Z\u00c0-\u017f]*|Mango|Ucaro|\u00dacar[a-zA-Z\u00c0-\u017f]*|Camoruco|Nispero|N\u00edspero/gi,
      ) ?? [];

    const names = Array.from(
      new Set<string>(
        matches
          .map((item: string) => normalizeTreeName(item))
          .filter((item: string) => item.length > 0),
      ),
    );

    if (!names.length) {
      return fallbackTreeNames;
    }

    return names;
  } catch {
    return fallbackTreeNames;
  }
};

const treeDescriptionByName: Record<string, string> = {
  Araguaney:
    "Arbol nativo de floracion amarilla intensa en epoca seca, ideal para paisaje y biodiversidad.",
  Apamate:
    "Especie ornamental de flor rosada o lila, usada para sombra ligera y alto valor estetico.",
  Flamboyan:
    "Arbol de copa amplia y floracion roja-anaranjada, util para sombra en espacios abiertos.",
  Mango:
    "Arbol frutal de sombra densa, aporta cobertura termica y frutos estacionales.",
  Ucaro:
    "Especie resistente al calor con follaje denso y raices poco agresivas para zonas urbanas.",
  Camoruco:
    "Arbol de crecimiento rapido y porte alto, adecuado para reforestacion en areas amplias.",
  Nispero:
    "Arbol perenne de tamano medio, util para jardines con espacio moderado y produccion frutal.",
};

const treeImagePool = [
  "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502085671122-2d218cd434e6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=1200&q=80",
];

const commonTreeNames: string[] = readCommonTreeNames();

export const treeTypeSeeds: TreeTypeSeed[] = commonTreeNames.map(
  (name: string, index: number): TreeTypeSeed => ({
    name,
    description:
      treeDescriptionByName[name] ||
      "Especie propuesta para catalogo de arboles en areas verdes universitarias.",
    reference_images: [
      treeImagePool[index % treeImagePool.length],
      treeImagePool[(index + 3) % treeImagePool.length],
    ],
  }),
);

export const treeInventorySeeds: TreeInventorySeed[] = [
  {
    name: "Arbol JC-01",
    health_status: "healthy",
    green_space_name: "Jardín Central",
    tree_type_name: "Araguaney",
    image_urls: [
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
    ],
    created_at: "2026-08-20T09:00:00.000Z",
  },
  {
    name: "Arbol JC-02",
    health_status: "regular",
    green_space_name: "Jardín Central",
    tree_type_name: "Mango",
    image_urls: [
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
    ],
    created_at: "2026-08-22T10:10:00.000Z",
  },
  {
    name: "Arbol BU-01",
    health_status: "healthy",
    green_space_name: "Bosque Universitario",
    tree_type_name: "Ucaro",
    image_urls: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
    created_at: "2026-08-24T11:30:00.000Z",
  },
  {
    name: "Arbol PF-01",
    health_status: "sick",
    green_space_name: "Parque de la Facultad",
    tree_type_name: "Apamate",
    image_urls: [
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80",
    ],
    created_at: "2026-08-25T13:45:00.000Z",
  },
  {
    name: "Arbol SV-01",
    health_status: "regular",
    green_space_name: "Sendero Verde",
    tree_type_name: "Flamboyan",
    image_urls: [
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
    ],
    created_at: "2026-08-27T08:20:00.000Z",
  },
  {
    name: "Arbol ADE-01",
    health_status: "healthy",
    green_space_name: "Área de descanso Estudiantil",
    tree_type_name: "Nispero",
    image_urls: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80",
    ],
    created_at: "2026-08-29T16:05:00.000Z",
  },
];

export const reportOfGreenAreaSeeds: ReportOfGreenAreaSeed[] = [
  {
    title: "Basureros saturados en sendero",
    description:
      "Los basureros del tramo norte estan saturados y se requiere mayor frecuencia de recoleccion.",
    url_images: ["/green-spaces/bosque-ingenieria-2.svg"],
    state: "open",
    username: "regular.user",
    green_space_name: "Sendero Verde",
    created_at: "2026-09-01T11:15:00.000Z",
  },
  {
    title: "Sugerencia de nuevo punto de sombra",
    description:
      "Propuesta para instalar pergola liviana cerca del acceso principal del Jardin Central.",
    url_images: ["/green-spaces/jardin-central-2.svg"],
    state: "open",
    username: "daniela.t",
    green_space_name: "Jardín Central",
    created_at: "2026-09-02T09:00:00.000Z",
  },
  {
    title: "Iluminacion reparada en parque",
    description:
      "El reporte de iluminacion deficiente fue atendido y las luminarias quedaron operativas.",
    url_images: ["/green-spaces/plaza-ecologica-sur-2.svg"],
    state: "closed",
    username: "admin",
    green_space_name: "Parque de la Facultad",
    created_at: "2026-08-28T18:20:00.000Z",
  },
];

export const greenMetricRecordSeeds: GreenMetricRecordSeed[] = [
  {
    calculation_date: "2025-11-15T00:00:00.000Z",
    total_campus_area_m2: 25000,
    green_area_m2: 7300,
    campus_population: 5600,
    dense_vegetation_area_m2: 3600,
    rainwater_absorption_area_m2: 4300,
    sustainability_budget: 98000,
    conservation_operation_budget: 65000,
    username: "admin",
  },
  {
    calculation_date: "2026-02-15T00:00:00.000Z",
    total_campus_area_m2: 25000,
    green_area_m2: 7600,
    campus_population: 5750,
    dense_vegetation_area_m2: 3800,
    rainwater_absorption_area_m2: 4500,
    sustainability_budget: 104000,
    conservation_operation_budget: 67000,
    username: "admin",
  },
  {
    calculation_date: "2026-05-15T00:00:00.000Z",
    total_campus_area_m2: 25000,
    green_area_m2: 8100,
    campus_population: 5980,
    dense_vegetation_area_m2: 4100,
    rainwater_absorption_area_m2: 4900,
    sustainability_budget: 112000,
    conservation_operation_budget: 70000,
    username: "admin",
  },
  {
    calculation_date: "2026-08-15T00:00:00.000Z",
    total_campus_area_m2: 25000,
    green_area_m2: 8350,
    campus_population: 6120,
    dense_vegetation_area_m2: 4350,
    rainwater_absorption_area_m2: 5200,
    sustainability_budget: 120000,
    conservation_operation_budget: 73000,
    username: "admin",
  },
];

export const proposalSeeds: ProposalSeed[] = [
  {
    title: "Huerto comunitario estudiantil",
    description:
      "Implementar un huerto comunitario para actividades de aprendizaje y alimentacion sostenible.",
    status: "open",
    minimum_votes_required: 3,
    voting_starts: "2026-09-01T09:00:00.000Z",
    voting_ends: "2026-09-20T18:00:00.000Z",
    username: "regular.user",
    green_space_name: "Jardín Central",
  },
  {
    title: "Reforestacion de sendero norte",
    description:
      "Plantar especies nativas para recuperar zonas erosionadas del sendero peatonal.",
    status: "open",
    minimum_votes_required: 3,
    voting_starts: "2026-09-02T10:00:00.000Z",
    voting_ends: "2026-09-25T20:00:00.000Z",
    username: "daniela.t",
    green_space_name: "Sendero Verde",
  },
  {
    title: "Sistema de riego por goteo",
    description:
      "Instalar riego por goteo en el area central para mejorar uso eficiente de agua.",
    status: "approved",
    minimum_votes_required: 3,
    voting_starts: "2026-08-01T08:00:00.000Z",
    voting_ends: "2026-08-10T18:00:00.000Z",
    username: "mateo.rios",
    green_space_name: "Parque de la Facultad",
  },
  {
    title: "Mobiliario con sombra natural",
    description:
      "Agregar bancas de madera y arboles de copa amplia en zonas de descanso estudiantil.",
    status: "approved",
    minimum_votes_required: 3,
    voting_starts: "2026-08-03T08:00:00.000Z",
    voting_ends: "2026-08-18T18:00:00.000Z",
    username: "laura.campos",
    green_space_name: "Área de descanso Estudiantil",
  },
  {
    title: "Jornadas de limpieza mensual",
    description:
      "Organizar jornadas mensuales para retiro de residuos y clasificacion de reciclables.",
    status: "rejected",
    minimum_votes_required: null,
    voting_starts: null,
    voting_ends: null,
    username: "regular.user",
    green_space_name: "Bosque Universitario",
  },
  {
    title: "Techos verdes en paradas internas",
    description:
      "Instalar cubiertas vegetales ligeras en paradas peatonales para reducir calor y mejorar confort.",
    status: "draft",
    minimum_votes_required: null,
    voting_starts: null,
    voting_ends: null,
    username: "daniela.t",
    green_space_name: "Jardín Central",
  },
  {
    title: "Compostaje colaborativo interfacultades",
    description:
      "Crear puntos de compostaje para residuos organicos de cafeterias y jardines del campus.",
    status: "draft",
    minimum_votes_required: null,
    voting_starts: null,
    voting_ends: null,
    username: "mateo.rios",
    green_space_name: "Bosque Universitario",
  },
  {
    title: "Corredor de polinizadores nativos",
    description:
      "Sembrar franjas de especies florales nativas para atraer abejas, mariposas y mejorar biodiversidad.",
    status: "open",
    minimum_votes_required: 4,
    voting_starts: "2026-09-05T08:30:00.000Z",
    voting_ends: "2026-09-28T18:30:00.000Z",
    username: "laura.campos",
    green_space_name: "Parque de la Facultad",
  },
  {
    title: "Sendero accesible con drenaje permeable",
    description:
      "Renovar tramos del sendero con material permeable y accesibilidad universal para epoca de lluvias.",
    status: "open",
    minimum_votes_required: 3,
    voting_starts: "2026-09-06T09:00:00.000Z",
    voting_ends: "2026-09-24T19:00:00.000Z",
    username: "regular.user",
    green_space_name: "Sendero Verde",
  },
  {
    title: "Censo digital de biodiversidad estacional",
    description:
      "Implementar jornadas semestrales de registro de especies con apoyo estudiantil y datos abiertos.",
    status: "closed",
    minimum_votes_required: 5,
    voting_starts: "2026-07-10T08:00:00.000Z",
    voting_ends: "2026-07-25T17:00:00.000Z",
    username: "daniela.t",
    green_space_name: "Área de descanso Estudiantil",
  },
  {
    title: "Microbosque de aprendizaje ambiental",
    description:
      "Establecer un microbosque con especies locales para practicas de educacion ambiental y monitoreo.",
    status: "rejected",
    minimum_votes_required: null,
    voting_starts: null,
    voting_ends: null,
    username: "mateo.rios",
    green_space_name: "Jardín Central",
  },
  {
    title: "Sistemas de captacion de agua de lluvia",
    description:
      "Recolectar agua de lluvia para riego de viveros y zonas verdes con almacenamiento modular.",
    status: "approved",
    minimum_votes_required: 4,
    voting_starts: "2026-08-11T08:00:00.000Z",
    voting_ends: "2026-08-29T18:00:00.000Z",
    username: "laura.campos",
    green_space_name: "Parque de la Facultad",
  },
];

export const voteOfProposalSeeds: VoteOfProposalSeed[] = [
  {
    proposal_title: "Huerto comunitario estudiantil",
    username: "daniela.t",
    created_at: "2026-09-03T12:10:00.000Z",
  },
  {
    proposal_title: "Huerto comunitario estudiantil",
    username: "mateo.rios",
    created_at: "2026-09-03T12:22:00.000Z",
  },
  {
    proposal_title: "Huerto comunitario estudiantil",
    username: "laura.campos",
    created_at: "2026-09-03T12:35:00.000Z",
  },
  {
    proposal_title: "Reforestacion de sendero norte",
    username: "regular.user",
    created_at: "2026-09-04T09:10:00.000Z",
  },
  {
    proposal_title: "Reforestacion de sendero norte",
    username: "mateo.rios",
    created_at: "2026-09-04T09:25:00.000Z",
  },
  {
    proposal_title: "Sistema de riego por goteo",
    username: "regular.user",
    created_at: "2026-08-05T11:00:00.000Z",
  },
  {
    proposal_title: "Sistema de riego por goteo",
    username: "daniela.t",
    created_at: "2026-08-05T11:12:00.000Z",
  },
  {
    proposal_title: "Sistema de riego por goteo",
    username: "laura.campos",
    created_at: "2026-08-05T11:26:00.000Z",
  },
  {
    proposal_title: "Mobiliario con sombra natural",
    username: "regular.user",
    created_at: "2026-08-08T15:00:00.000Z",
  },
  {
    proposal_title: "Mobiliario con sombra natural",
    username: "mateo.rios",
    created_at: "2026-08-08T15:20:00.000Z",
  },
];

export const projectOfProposalSeeds: ProjectOfProposalSeed[] = [
  {
    title: "Implementacion inicial de riego",
    description:
      "Inicio de obra con instalacion de lineas principales y valvulas en zonas prioritarias.",
    completed_status: "in_progress",
    proposal_title: "Sistema de riego por goteo",
    green_space_name: "Parque de la Facultad",
  },
  {
    title: "Zona de descanso bajo sombra",
    description:
      "Construccion de bancas, sendero de acceso y plantacion complementaria de arboles.",
    completed_status: "planned",
    proposal_title: "Mobiliario con sombra natural",
    green_space_name: "Área de descanso Estudiantil",
  },
  {
    title: "Piloto de huerto comunitario",
    description:
      "Proyecto piloto con camas de cultivo, compostera y señaletica educativa.",
    completed_status: "planned",
    proposal_title: "Huerto comunitario estudiantil",
    green_space_name: "Jardín Central",
  },
];

export const projectUpdateOfProposalSeeds: ProjectUpdateOfProposalSeed[] = [
  {
    title: "Levantamiento topografico y trazado",
    description:
      "Se midieron sectores criticos y se definieron los tramos para instalar la red principal de riego.",
    activity_images: [
      "/green-spaces/jardin-central-1.svg",
      "/green-spaces/jardin-central-2.svg",
    ],
    project_title: "Implementacion inicial de riego",
    username: "mateo.rios",
    created_at: "2026-08-21T10:15:00.000Z",
  },
  {
    title: "Instalacion de lineas secundarias",
    description:
      "Se completaron conexiones en el 60% del parque y se realizaron pruebas de presion sin fugas.",
    activity_images: ["/uploads/green-spaces/gs-1784588213929-0.jpg"],
    project_title: "Implementacion inicial de riego",
    username: "admin",
    created_at: "2026-08-27T16:40:00.000Z",
  },
  {
    title: "Diseno participativo del mobiliario",
    description:
      "Estudiantes validaron la ubicacion de bancas y tipos de sombra para zonas de mayor uso.",
    activity_images: ["/green-spaces/plaza-ecologica-sur-1.svg"],
    project_title: "Zona de descanso bajo sombra",
    username: "laura.campos",
    created_at: "2026-08-25T14:00:00.000Z",
  },
  {
    title: "Preparacion de suelo y compost",
    description:
      "Se habilitaron camas de cultivo iniciales y se integro compost generado en campus.",
    activity_images: [
      "/green-spaces/bosque-ingenieria-1.svg",
      "/uploads/green-spaces/gs-1785434722487-0.jpg",
    ],
    project_title: "Piloto de huerto comunitario",
    username: "daniela.t",
    created_at: "2026-09-01T09:30:00.000Z",
  },
];

export const findFlowerScoreSeeds: FindFlowerScoreSeed[] = [
  {
    username: "admin",
    max_score: 4010,
    best_time_seconds: 74,
    best_moves: 45,
    updated_at: "2026-09-10T10:10:00.000Z",
  },
  {
    username: "laura.campos",
    max_score: 3840,
    best_time_seconds: 83,
    best_moves: 49,
    updated_at: "2026-09-10T11:15:00.000Z",
  },
  {
    username: "daniela.t",
    max_score: 3720,
    best_time_seconds: 88,
    best_moves: 52,
    updated_at: "2026-09-10T11:45:00.000Z",
  },
  {
    username: "mateo.rios",
    max_score: 3495,
    best_time_seconds: 97,
    best_moves: 58,
    updated_at: "2026-09-10T12:12:00.000Z",
  },
  {
    username: "regular.user",
    max_score: 3360,
    best_time_seconds: 105,
    best_moves: 61,
    updated_at: "2026-09-10T12:48:00.000Z",
  },
];
