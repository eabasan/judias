// Define las cartas del juego
export function crearMazo() {
  return [
    { nombre: "Judia Bill" },
    { nombre: "Rocky Judía" },
    { nombre: "Judía Boom" },
    { nombre: "Judia Bill" },
    { nombre: "Judía Boom" },
    { nombre: "Rocky Judía" },
    { nombre: "Judía Boom" },
    { nombre: "Judia Bill" }
    // Añade más cartas si quieres
  ];
}

// Repartir cartas al azar
export function repartirCartas(mazo, cantidad) {
  const mano = [];
  const copia = [...mazo];
  for (let i = 0; i < cantidad; i++) {
    if (copia.length === 0) break;
    const index = Math.floor(Math.random() * copia.length);
    mano.push(copia.splice(index, 1)[0]);
  }
  return mano;
}

// Reconstruir carta desde nombre
export function reconstruirCarta(nombre) {
  const todos = crearMazo();
  return todos.find(c => c.nombre === nombre);
}
