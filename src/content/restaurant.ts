/**
 * Single source of truth for Fogo de Chão · Ventura Mall.
 *
 * Everything the website renders AND everything Sofía (the AI receptionist)
 * knows comes from this file. Fields marked `CONFIRM` are sensible launch
 * defaults that management must verify before going live. Fields set to
 * `null` are unknown: the site hides them and Sofía says she will confirm
 * with the team instead of inventing an answer.
 */

export type Lang = "es" | "en";
type L = Record<Lang, string>;

export const RESTAURANT = {
  name: "Fogo de Chão",
  branch: "Ventura Mall",
  city: "Santa Cruz de la Sierra",
  country: "Bolivia",
  timezone: "America/La_Paz",
  // CONFIRM: exact unit / address line inside Ventura Mall
  address: {
    es: "Boulevard, Ventura Mall · 4to Anillo, Av. San Martín, Santa Cruz de la Sierra",
    en: "Boulevard, Ventura Mall · 4th Ring, Av. San Martín, Santa Cruz de la Sierra",
  } satisfies L,
  mapsQuery: "Ventura Mall, Santa Cruz de la Sierra, Bolivia",
  // CONFIRM: opening date ("end of the month")
  openingDate: "2026-10-31T19:00:00-04:00",
  phone: null as string | null,
  whatsapp: null as string | null,
  email: null as string | null,
  instagram: "https://www.instagram.com/fogodechao.bo/",
  instagramHandle: "@fogodechao.bo",
  founded: 1979,
  origin: "Porto Alegre, Rio Grande do Sul, Brasil",
};

/** CONFIRM: service hours. Day indexes follow JS (0 = Sunday). */
export const HOURS = [
  { days: [1, 2, 3, 4, 5, 6, 0], service: "lunch", open: "12:00", close: "15:30" },
  { days: [1, 2, 3, 4, 5, 6, 0], service: "dinner", open: "19:00", close: "23:00" },
] as const;

export const HOURS_LABEL: Record<"lunch" | "dinner", L> = {
  lunch: { es: "Almuerzo", en: "Lunch" },
  dinner: { es: "Cena", en: "Dinner" },
};

/** Reservation engine settings (used by the API + Sofía). CONFIRM capacity. */
export const BOOKING = {
  slotMinutes: 30,
  diningMinutes: 120,
  /** Seats bookable online per overlapping 2h window. Walk-ins use the rest. */
  onlineCovers: 110,
  maxPartyOnline: 12,
  minNoticeMinutes: 60,
  maxDaysAhead: 90,
  holdMinutes: 15,
  /** Last seating = close minus this */
  lastSeatingBeforeCloseMinutes: 60,
};

/**
 * Prices in Bolivianos. null = not yet published → Sofía will not quote.
 * CONFIRM and fill before launch.
 */
export const PRICES: {
  churrasco: number | null;
  marketTable: number | null;
  kidsPolicy: L;
} = {
  churrasco: null,
  marketTable: null,
  // CONFIRM: mirrors Fogo de Chão's international policy
  kidsPolicy: {
    es: "Niños de 6 años o menos comen gratis; de 7 a 12 años pagan la mitad del Churrasco.",
    en: "Children 6 and under dine free; ages 7–12 pay half of the Churrasco price.",
  },
};

export const CUTS: { pt: string; name: L; desc: L }[] = [
  {
    pt: "Picanha",
    name: { es: "Tapa de cuadril", en: "Prime top sirloin" },
    desc: {
      es: "La firma de la casa. Curvada en la espada con su capa de grasa, sellada a fuego vivo y terminada con sal gruesa.",
      en: "The signature. Curled onto the skewer with its fat cap, seared over open flame and finished with rock salt.",
    },
  },
  {
    pt: "Fraldinha",
    name: { es: "Vacío", en: "Bottom sirloin" },
    desc: {
      es: "Fibra larga y jugosa, el corte favorito de los gaúchos del sur de Brasil.",
      en: "Long-grained and juicy — the favourite of southern Brazil's gaúchos.",
    },
  },
  {
    pt: "Alcatra",
    name: { es: "Cuadril", en: "Top sirloin" },
    desc: {
      es: "Magro, firme y profundo en sabor. Se corta fino, al punto que tú elijas.",
      en: "Lean, firm and deeply flavoured. Carved thin, to the doneness you choose.",
    },
  },
  {
    pt: "Costela",
    name: { es: "Costilla de res", en: "Beef ribs" },
    desc: {
      es: "Horas de fuego lento hasta que la carne se rinde del hueso.",
      en: "Hours over a slow fire until the meat surrenders from the bone.",
    },
  },
  {
    pt: "Filet Mignon",
    name: { es: "Lomo fino", en: "Tenderloin" },
    desc: {
      es: "Medallones de lomo, tiernos como mantequilla; también envueltos en tocino.",
      en: "Butter-tender medallions of tenderloin — also served wrapped in bacon.",
    },
  },
  {
    pt: "Cordeiro",
    name: { es: "Cordero", en: "Lamb" },
    desc: {
      es: "Chuletas y pierna de cordero marinadas en hierbas frescas.",
      en: "Lamb chops and leg, marinated in fresh herbs.",
    },
  },
  {
    pt: "Linguiça",
    name: { es: "Chorizo brasileño", en: "Brazilian sausage" },
    desc: {
      es: "Embutido de cerdo levemente picante, crujiente por fuera.",
      en: "Mildly spiced pork sausage, crackling on the outside.",
    },
  },
  {
    pt: "Frango",
    name: { es: "Pollo", en: "Chicken" },
    desc: {
      es: "Muslos marinados en cerveza y limón, piel dorada y crocante.",
      en: "Thighs marinated in beer and lime, with golden crisp skin.",
    },
  },
];

export const MARKET_TABLE: { group: L; items: L[] }[] = [
  {
    group: { es: "De la huerta", en: "From the garden" },
    items: [
      { es: "Ensaladas de estación", en: "Seasonal salads" },
      { es: "Palmitos y espárragos", en: "Hearts of palm & asparagus" },
      { es: "Vegetales asados", en: "Roasted vegetables" },
      { es: "Quinua del altiplano", en: "Highland quinoa" },
    ],
  },
  {
    group: { es: "Curados y quesos", en: "Cured & cheeses" },
    items: [
      { es: "Salame y jamón curado", en: "Salami & cured ham" },
      { es: "Parmesano añejo", en: "Aged Parmesan" },
      { es: "Mozzarella fresca", en: "Fresh mozzarella" },
      { es: "Aceitunas marinadas", en: "Marinated olives" },
    ],
  },
  {
    group: { es: "Tradición brasileña", en: "Brazilian tradition" },
    items: [
      { es: "Feijoada", en: "Feijoada" },
      { es: "Arroz blanco y farofa", en: "White rice & farofa" },
      { es: "Pão de queijo", en: "Pão de queijo" },
      { es: "Plátano caramelizado", en: "Caramelised banana" },
    ],
  },
];

export const BAR: { name: string; desc: L }[] = [
  {
    name: "Caipirinha",
    desc: {
      es: "Cachaça, lima y azúcar. El brindis nacional de Brasil.",
      en: "Cachaça, lime and sugar — Brazil's national toast.",
    },
  },
  {
    name: "Caipiroska de maracuyá",
    desc: {
      es: "Vodka, maracuyá fresco y un toque de menta.",
      en: "Vodka, fresh passion fruit and a hint of mint.",
    },
  },
  {
    name: "Tintos del sur",
    desc: {
      es: "Malbec de Mendoza, Carménère chileno y Tannat de Tarija.",
      en: "Mendoza Malbec, Chilean Carménère and Tarija Tannat.",
    },
  },
];

export const DESSERTS: L[] = [
  { es: "Crema de papaya con licor de cassis", en: "Papaya cream with cassis liqueur" },
  { es: "Torta tres leches", en: "Tres leches cake" },
  { es: "Pastel de chocolate brigadeiro", en: "Brigadeiro chocolate cake" },
  { es: "Crème brûlée", en: "Crème brûlée" },
];

/** Policies & FAQ — Sofía answers from these. CONFIRM all before launch. */
export const POLICIES: { topic: string; text: L }[] = [
  {
    topic: "dress_code",
    text: {
      es: "Elegante casual. No se requiere saco ni corbata.",
      en: "Smart casual. Jacket and tie are not required.",
    },
  },
  {
    topic: "late_arrival",
    text: {
      es: "Guardamos la mesa 15 minutos. Pasado ese tiempo puede liberarse.",
      en: "We hold the table for 15 minutes; after that it may be released.",
    },
  },
  {
    topic: "large_groups",
    text: {
      es: "Grupos de más de 12 personas y eventos privados se coordinan con nuestro equipo de eventos.",
      en: "Groups larger than 12 and private events are arranged with our events team.",
    },
  },
  {
    topic: "dietary",
    text: {
      es: "La Mesa del Mercado tiene amplias opciones vegetarianas; el pão de queijo es naturalmente sin gluten. Avísanos de cualquier alergia al reservar.",
      en: "The Market Table offers plenty of vegetarian options; pão de queijo is naturally gluten-free. Tell us about any allergy when booking.",
    },
  },
  {
    topic: "parking",
    text: {
      es: "Estacionamiento disponible en Ventura Mall.",
      en: "Parking is available at Ventura Mall.",
    },
  },
  {
    topic: "celebrations",
    text: {
      es: "Cumpleaños y aniversarios: indícalo en la reserva y prepararemos un detalle en la mesa.",
      en: "Birthdays and anniversaries: mention it when booking and we'll prepare a touch at the table.",
    },
  },
  {
    topic: "accessibility",
    text: {
      es: "Acceso a nivel y baños accesibles dentro del mall.",
      en: "Step-free access and accessible restrooms within the mall.",
    },
  },
  {
    topic: "token",
    text: {
      es: "Cada comensal recibe una ficha: verde para que los gaúchos sigan pasando cortes, roja para pausar.",
      en: "Each guest gets a card: green to keep the gaúchos coming with cuts, red to pause.",
    },
  },
];
