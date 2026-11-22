// ConfiguraciÃ³n central del Calendario de Adviento (editable)
// Cambia aquÃ­ tÃ­tulos, config de juegos, fotos y mensajes finales.

export const CONFIG = {
  iniciales: "J & B", // Ej: "A & B"
  subtitulo: "24 dÃ­as contigo",
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
    photo: "public/fotos/dia01.jpg",
    message: "Cada vuelo a tu lado es mi aventura favorita. Â¡Feliz dÃ­a 1!"
  },
  {
    day: 2,
    title: "Rasca y Gana",
    gameId: "day02",
    gameConfig: { revealPercent: 55 },
    photo: "public/fotos/dia02.jpg",
    message: "Debajo de cualquier capa siempre te encuentro a ti."
  },
  {
    day: 3,
    title: "Quiz de Jaime",
    gameId: "day03",
    gameConfig: {
      questions: [
        { q: "Â¿CuÃ¡l es mi plan favorito?", options: ["Jugar a la Compu", "Fumar", "Momart"], answer: 0 },
        { q: "Â¿CuÃ¡l es mi comida favorita?", options: ["Pizza", "Kebab", "No tengo"], answer: 2 },
        { q: "Â¿Como me llamo en el WOW?", options: ["GreÃ±aMaster Aura", "DemaciaDosexy", "DedeaSapos"], answer: 0 }
      ]
    },
    photo: "public/fotos/dia03.jpg",
    message: "Nadie conoce nuestra historia como tÃº."
  },
  {
    day: 4,
    title: "Infla el CorazÃ³n",
    gameId: "day04",
    gameConfig: { durationMs: 10000, targetTaps: 150 },
    photo: "public/fotos/dia04.jpg",
    message: "Mi corazÃ³n late mÃ¡s fuerte cuando estÃ¡s cerca."
  },
  {
    day: 5,
    title: "Memory de Recuerdos",
    gameId: "day05",
    gameConfig: { pairs: ["??", "??", "?", "??", "??", "??"] },
    photo: "public/fotos/dia05.jpg",
    message: "Cada recuerdo contigo es mi favorito."
  },
  {
    day: 6,
    title: "Lluvia de Besos",
    gameId: "day06",
    gameConfig: { targetHearts: 20 },
    photo: "public/fotos/dia06.png",
    message: "Contigo hasta la lluvia sabe a besos."
  },
  {
    day: 7,
    title: "Adivina que soy",
    gameId: "day07",
    gameConfig: { word: "QUESO" },
    photo: "public/fotos/dia07.jpeg",
    message: "Soy suave, rico y siempre te hago sonreÃ­r."
  },
  {
    day: 8,
    title: "Gira el Recuerdo",
    gameId: "day08",
    gameConfig: { grid: 3 },
    photo: "public/fotos/dia08.jpg",
    message: "Contigo todo encaja, pieza a pieza."
  },
  {
    day: 9,
    title: "Â¡Atrapa al Elfo!",
    gameId: "day09",
    gameConfig: { targetHits: 20 },
    photo: "public/fotos/dia09.png",
    message: "Siempre te atraparÃ­a a ti, una y otra vez."
  },
  {
    day: 10,
    title: "Para el Tiempo",
    gameId: "day10",
    gameConfig: { min: 5.0, max: 5.10 },
    photo: "public/fotos/dia10.jpeg",
    message: "El mejor momento es cualquiera si es contigo."
  },
  {
    day: 11,
    title: "Decora el Ãrbol",
    gameId: "day11",
    gameConfig: { ornaments: 6 },
    photo: "public/fotos/dia11.jpeg",
    message: "Cada adorno es un motivo mÃ¡s para sonreÃ­r contigo."
  },
  {
    day: 12,
    title: "Pesca NavideÃ±a",
    gameId: "day12",
    gameConfig: { target: 10 },
    photo: "public/fotos/dia12.jpg",
    message: "Has pescado los mejores tesoros: nuestros momentos."
  },
  {
    day: 13,
    title: "Esquiva la Ventisca",
    gameId: "day13",
    gameConfig: { durationMs: 45000 },
    photo: "public/fotos/dia13.jpg",
    message: "Juntos esquivamos cualquier tormenta."
  },
  {
    day: 14,
    title: "SimÃ³n Dice NavideÃ±o",
    gameId: "day14",
    gameConfig: { steps: 6 },
    photo: "public/fotos/dia14.png",
    message: "Mi corazÃ³n sigue tu ritmo."
  },
  {
    day: 15,
    title: "Puzle Deslizante",
    gameId: "day15",
    gameConfig: { grid: 3 },
    photo: "public/fotos/dia15.jpg",
    message: "Eres la pieza que completa mi vida."
  },
  {
    day: 16,
    title: "Rompeladrillos de Amor",
    gameId: "day16",
    gameConfig: { rows: 3, cols: 6 },
    photo: "public/fotos/dia16.png",
    message: "RomperÃ­a mil muros por verte sonreÃ­r."
  },
  {
    day: 17,
    title: "Une las Estrellas",
    gameId: "day17",
    gameConfig: { points: 10 },
    photo: "public/fotos/dia17.jpg",
    message: "Entre todas las estrellas, te elijo a ti."
  },
  {
    day: 18,
    title: "Sopa de Letras",
    gameId: "day18",
    gameConfig: { size: 9, words: ["AMOR", "BESO", "NIEVE", "CHICHARRON", "NAVIDAD"] },
    photo: "public/fotos/dia18.jpg",
    message: "En cualquier sopa de letras te encontrarÃ­a."
  },
  {
    day: 19,
    title: "Salto a las Nubes",
    gameId: "day19",
    gameConfig: { targetHeight: 4200 },
    photo: "public/fotos/dia19.jpeg",
    message: "Contigo llego hasta las estrellas."
  },
  {
    day: 20,
    title: "Cupido al Blanco",
    gameId: "day20",
    gameConfig: { targetHits: 10 },
    photo: "public/fotos/dia20.jpg",
    message: "Tu amor siempre da en el blanco."
  },
  {
    day: 21,
    title: "Torre de Regalos",
    gameId: "day21",
    gameConfig: { targetStack: 10 },
    photo: "public/fotos/dia21.png",
    message: "Construyamos juntos lo mÃ¡s bonito."
  },
  {
    day: 22,
    title: "Laberinto de Invierno",
    gameId: "day22",
    gameConfig: {},
    photo: "public/fotos/dia22.png",
    message: "No importa el camino si me lleva a ti."
  },
  {
    day: 23,
    title: "Convence al Elfo GruÃ±Ã³n",
    gameId: "day23",
    gameConfig: {
      herName: "[NOMBRE_ELLA]",
      yourName: "[TU_NOMBRE]"
      // La clave OpenAI se configura en Vercel como OPENAI_API_KEY (lado servidor, /api/chat).
      // No pongas apiKey en el cliente.
    },
    photo: "public/fotos/dia23.png",
    message: "Hasta el elfo gruÃ±Ã³n se rinde ante tu encanto."
  },
  {
    day: 24,
    title: "El Regalo de Nochebuena",
    gameId: "day24",
    gameConfig: { phases: 3 },
    photo: "public/fotos/dia24.jpg",
    message: "TÃº eres mi mejor regalo, hoy y siempre. Feliz Nochebuena."
  }
];
