// Configuración central del Calendario de Adviento (editable)
// Cambia aquí títulos, config de juegos, fotos y mensajes finales.

export const CONFIG = {
  iniciales: "J & B", // Ej: "A & B"
  subtitulo: "24 días contigo",
  avatars: {
    me: "public/avatars/yo1.png",
    partner: "public/avatars/pareja.png",
  },
};

export const DIAS = [
  {
    day: 1,
    title: "Flappy Love",
    gameId: "day01",
    gameConfig: { target: 12 },
    photo: "public/fotos/dia01.svg",
    message: "Cada vuelo a tu lado es mi aventura favorita. ¡Feliz día 1!"
  },
  {
    day: 2,
    title: "Rasca y Gana",
    gameId: "day02",
    gameConfig: { revealPercent: 55 },
    photo: "public/fotos/dia02.svg",
    message: "Debajo de cualquier capa siempre te encuentro a ti."
  },
  {
    day: 3,
    title: "Quiz de Jaime",
    gameId: "day03",
    gameConfig: {
      questions: [
        { q: "¿Cuál es mi plan favorito?", options: ["Jugar a la Compu", "Fumar", "Momart"], answer: 0 },
        { q: "¿Cuál es mi comida favorita?", options: ["Pizza", "Kebab", "No tengo"], answer: 2 },
        { q: "¿Como me llamo en el WOW?", options: ["GreñaMaster Aura", "DemaciaDosexy", "DedeaSapos"], answer: 0 }
      ]
    },
    photo: "public/fotos/dia03.svg",
    message: "Nadie conoce nuestra historia como tú."
  },
  {
    day: 4,
    title: "Infla el Corazón",
    gameId: "day04",
    gameConfig: { durationMs: 10000, targetTaps: 75 },
    photo: "public/fotos/dia04.svg",
    message: "Mi corazón late más fuerte cuando estás cerca."
  },
  {
    day: 5,
    title: "Memory de Recuerdos",
    gameId: "day05",
    gameConfig: { pairs: ["❤️", "🎄", "⭐", "🎁", "☃️", "💌"] },
    photo: "public/fotos/dia05.svg",
    message: "Cada recuerdo contigo es mi favorito."
  },
  {
    day: 6,
    title: "Lluvia de Besos",
    gameId: "day06",
    gameConfig: { targetHearts: 20 },
    photo: "public/fotos/dia06.svg",
    message: "Contigo hasta la lluvia sabe a besos."
  },
  {
    day: 7,
    title: "Adivina que soy",
    gameId: "day07",
    gameConfig: { word: "QUESO" },
    photo: "public/fotos/dia07.svg",
    message: "Soy suave, rico y siempre te hago sonreír."
  },
  {
    day: 8,
    title: "Gira el Recuerdo",
    gameId: "day08",
    gameConfig: { grid: 3 },
    photo: "public/fotos/dia08.svg",
    message: "Contigo todo encaja, pieza a pieza."
  },
  {
    day: 9,
    title: "¡Atrapa al Elfo!",
    gameId: "day09",
    gameConfig: { targetHits: 10 },
    photo: "public/fotos/dia09.svg",
    message: "Siempre te atraparía a ti, una y otra vez."
  },
  {
    day: 10,
    title: "Para el Tiempo",
    gameId: "day10",
    gameConfig: { min: 5.0, max: 5.0 },
    photo: "public/fotos/dia10.svg",
    message: "El mejor momento es cualquiera si es contigo."
  },
  {
    day: 11,
    title: "Decora el Árbol",
    gameId: "day11",
    gameConfig: { ornaments: 6 },
    photo: "public/fotos/dia11.svg",
    message: "Cada adorno es un motivo más para sonreír contigo."
  },
  {
    day: 12,
    title: "Pesca Navideña",
    gameId: "day12",
    gameConfig: { target: 6 },
    photo: "public/fotos/dia12.svg",
    message: "Has pescado los mejores tesoros: nuestros momentos."
  },
  {
    day: 13,
    title: "Esquiva la Ventisca",
    gameId: "day13",
    gameConfig: { durationMs: 45000 },
    photo: "public/fotos/dia13.svg",
    message: "Juntos esquivamos cualquier tormenta."
  },
  {
    day: 14,
    title: "Simón Dice Navideño",
    gameId: "day14",
    gameConfig: { steps: 5 },
    photo: "public/fotos/dia14.svg",
    message: "Mi corazón sigue tu ritmo."
  },
  {
    day: 15,
    title: "Puzle Deslizante",
    gameId: "day15",
    gameConfig: { grid: 3 },
    photo: "public/fotos/dia15.svg",
    message: "Eres la pieza que completa mi vida."
  },
  {
    day: 16,
    title: "Rompeladrillos de Amor",
    gameId: "day16",
    gameConfig: { rows: 3, cols: 6 },
    photo: "public/fotos/dia16.svg",
    message: "Rompería mil muros por verte sonreír."
  },
  {
    day: 17,
    title: "Une las Estrellas",
    gameId: "day17",
    gameConfig: { points: 10 },
    photo: "public/fotos/dia17.svg",
    message: "Entre todas las estrellas, te elijo a ti."
  },
  {
    day: 18,
    title: "Mini Sopa de Letras",
    gameId: "day18",
    gameConfig: { words: ["AMOR", "BESO", "NIEVE"] },
    photo: "public/fotos/dia18.svg",
    message: "En cualquier sopa de letras te encontraría."
  },
  {
    day: 19,
    title: "Salto a las Nubes",
    gameId: "day19",
    gameConfig: { targetHeight: 1800 },
    photo: "public/fotos/dia19.svg",
    message: "Contigo llego hasta las estrellas."
  },
  {
    day: 20,
    title: "¿Dónde está mi amor?",
    gameId: "day20",
    gameConfig: { scene: "public/wally/escena.jpg", target: { xPct: 0.62, yPct: 0.48, rPct: 0.08 }, hint: "Busca y toca el detalle escondido" },
    photo: "public/fotos/dia20.svg",
    message: "Te encontraría entre un millón."
  },
  {
    day: 21,
    title: "Torre de Regalos",
    gameId: "day21",
    gameConfig: { targetStack: 10 },
    photo: "public/fotos/dia21.svg",
    message: "Construyamos juntos lo más bonito."
  },
  {
    day: 22,
    title: "Laberinto de Invierno",
    gameId: "day22",
    gameConfig: {},
    photo: "public/fotos/dia22.svg",
    message: "No importa el camino si me lleva a ti."
  },
  {
    day: 23,
    title: "Convence al Elfo Gruñón",
    gameId: "day23",
    gameConfig: {
      herName: "[NOMBRE_ELLA]",
      yourName: "[TU_NOMBRE]"
      // La clave OpenAI se configura en Vercel como OPENAI_API_KEY (lado servidor, /api/chat).
      // No pongas apiKey en el cliente.
    },
    photo: "public/fotos/dia23.svg",
    message: "Hasta el elfo gruñón se rinde ante tu encanto."
  },
  {
    day: 24,
    title: "El Regalo de Nochebuena",
    gameId: "day24",
    gameConfig: { phases: 3 },
    photo: "public/fotos/dia24.svg",
    message: "Tú eres mi mejor regalo, hoy y siempre. Feliz Nochebuena."
  }
];
