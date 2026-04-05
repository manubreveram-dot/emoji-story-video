export type KeywordCategory = {
  name: string;
  keywords: string[];
  valence: 1 | -1 | 0;
  weight: number;
  intensity: "low" | "medium" | "high";
};

export const KEYWORD_CATEGORIES: KeywordCategory[] = [
  {
    name: "celebration",
    keywords: [
      "birthday", "congrats", "congratulations", "party", "cheers", "yay",
      "bravo", "fiesta", "celebrate", "celebration", "anniversary", "hooray",
      "cumpleanos", "felicidades", "felicitaciones", "celebrar",
    ],
    valence: 1,
    weight: 0.9,
    intensity: "high",
  },
  {
    name: "love",
    keywords: [
      "love", "heart", "kiss", "hug", "darling", "sweetheart", "romance",
      "valentine", "beloved", "adore", "cherish",
      "amor", "beso", "abrazo", "corazon", "querido", "te quiero",
    ],
    valence: 1,
    weight: 0.9,
    intensity: "high",
  },
  {
    name: "encouragement",
    keywords: [
      "amazing", "awesome", "proud", "strong", "believe", "brave", "great",
      "fantastic", "incredible", "wonderful", "brilliant", "excellent",
      "superb", "outstanding", "you can", "keep going",
      "increible", "genial", "orgulloso", "fuerte", "valiente",
    ],
    valence: 1,
    weight: 0.7,
    intensity: "medium",
  },
  {
    name: "greeting",
    keywords: [
      "hello", "hi", "welcome", "hey", "greetings", "good morning",
      "good evening", "good night",
      "hola", "bienvenido", "buenos dias", "buenas noches",
    ],
    valence: 1,
    weight: 0.3,
    intensity: "low",
  },
  {
    name: "farewell",
    keywords: [
      "goodbye", "bye", "see you", "farewell", "take care", "until next",
      "adios", "hasta luego", "nos vemos", "cuidate",
    ],
    valence: 0,
    weight: 0.3,
    intensity: "low",
  },
  {
    name: "humor",
    keywords: [
      "funny", "laugh", "haha", "lol", "joke", "hilarious", "comedy",
      "silly", "ridiculous", "lmao",
      "gracioso", "risa", "jaja", "chiste", "divertido",
    ],
    valence: 1,
    weight: 0.6,
    intensity: "medium",
  },
  {
    name: "sadness",
    keywords: [
      "sad", "sorry", "miss", "cry", "tears", "loss", "lonely", "grief",
      "heartbreak", "depressed", "sorrow", "mourn",
      "triste", "llorar", "lagrimas", "perdida", "solo", "dolor",
    ],
    valence: -1,
    weight: 0.8,
    intensity: "medium",
  },
  {
    name: "anger",
    keywords: [
      "angry", "mad", "hate", "furious", "rage", "frustrated", "annoyed",
      "irritated", "outraged",
      "enojado", "furioso", "odio", "rabia", "molesto",
    ],
    valence: -1,
    weight: 0.8,
    intensity: "high",
  },
  {
    name: "nature",
    keywords: [
      "flower", "tree", "ocean", "sea", "sun", "moon", "mountain", "rain",
      "garden", "forest", "river", "sky", "stars", "beach", "sunset",
      "flor", "arbol", "oceano", "sol", "luna", "montana", "playa",
    ],
    valence: 0,
    weight: 0.4,
    intensity: "low",
  },
  {
    name: "food",
    keywords: [
      "pizza", "cake", "coffee", "dinner", "cook", "delicious", "yummy",
      "breakfast", "lunch", "dessert", "chocolate", "ice cream",
      "pastel", "cafe", "cena", "cocinar", "delicioso", "comida",
    ],
    valence: 1,
    weight: 0.4,
    intensity: "low",
  },
  {
    name: "travel",
    keywords: [
      "trip", "vacation", "fly", "adventure", "journey", "explore", "travel",
      "destination", "holiday", "road trip", "passport",
      "viaje", "vacaciones", "aventura", "explorar", "destino",
    ],
    valence: 1,
    weight: 0.6,
    intensity: "medium",
  },
  {
    name: "work",
    keywords: [
      "meeting", "deadline", "project", "office", "business", "work",
      "presentation", "report", "team", "conference",
      "reunion", "oficina", "trabajo", "proyecto", "negocio",
    ],
    valence: 0,
    weight: 0.3,
    intensity: "low",
  },
  {
    name: "music",
    keywords: [
      "song", "dance", "music", "concert", "rhythm", "sing", "melody",
      "beat", "guitar", "piano", "dj",
      "cancion", "bailar", "musica", "concierto", "ritmo", "cantar",
    ],
    valence: 1,
    weight: 0.6,
    intensity: "medium",
  },
  {
    name: "sports",
    keywords: [
      "game", "win", "goal", "team", "champion", "run", "score", "match",
      "victory", "competition", "trophy",
      "juego", "ganar", "gol", "equipo", "campeon", "victoria",
    ],
    valence: 1,
    weight: 0.6,
    intensity: "medium",
  },
  {
    name: "weather",
    keywords: [
      "sunny", "rainy", "snow", "storm", "cloudy", "wind", "thunder",
      "rainbow", "fog", "hail",
      "soleado", "lluvioso", "nieve", "tormenta", "nublado", "arcoiris",
    ],
    valence: 0,
    weight: 0.3,
    intensity: "low",
  },
  {
    name: "technology",
    keywords: [
      "code", "computer", "app", "digital", "robot", "ai", "software",
      "programming", "internet", "data", "tech",
      "computadora", "aplicacion", "tecnologia", "programacion",
    ],
    valence: 0,
    weight: 0.3,
    intensity: "low",
  },
  {
    name: "money",
    keywords: [
      "rich", "money", "dollar", "invest", "pay", "expensive", "wealth",
      "profit", "salary", "budget", "savings",
      "dinero", "rico", "invertir", "pagar", "caro", "ahorro",
    ],
    valence: 0,
    weight: 0.5,
    intensity: "medium",
  },
  {
    name: "family",
    keywords: [
      "mom", "dad", "baby", "kids", "brother", "sister", "family", "son",
      "daughter", "parent", "grandma", "grandpa",
      "mama", "papa", "bebe", "hijos", "hermano", "hermana", "familia",
    ],
    valence: 1,
    weight: 0.6,
    intensity: "medium",
  },
  {
    name: "health",
    keywords: [
      "healthy", "exercise", "yoga", "meditation", "energy", "fitness",
      "wellness", "gym", "vitamin", "strength",
      "saludable", "ejercicio", "meditacion", "energia",
    ],
    valence: 1,
    weight: 0.4,
    intensity: "low",
  },
  {
    name: "time",
    keywords: [
      "morning", "night", "today", "tomorrow", "new year", "weekend",
      "christmas", "summer", "winter", "spring", "autumn",
      "manana", "noche", "hoy", "navidad", "verano", "invierno",
    ],
    valence: 0,
    weight: 0.3,
    intensity: "low",
  },
];
