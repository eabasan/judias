// mazo.js
export const judias = [
  { nombre: "Judía Boom", cantidad: 18 },
  { nombre: "La Pocha", cantidad: 14 },
  { nombre: "Judía Colorá", cantidad: 8 },
  { nombre: "La Pestosa", cantidad: 16 },
  { nombre: "Rocky Judía", cantidad: 10 },
  { nombre: "Judía Bill", cantidad: 20 },
  { nombre: "El Judicultor", cantidad: 6 },
  { nombre: "Hippy Judía", cantidad: 12 }
];

export function crearMazo() {
  let mazo = [];
  judias.forEach(j => {
    for (let i = 0; i < j.cantidad; i++) {
      mazo.push({ nombre: j.nombre });
    }
  });
  return barajar(mazo);
}

export function barajar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function repartirCartas(mazo, cantidad = 5) {
  const mano = [];
  for (let i = 0; i < cantidad; i++) {
    if (mazo.length === 0) break;
    mano.push(mazo.pop());
  }
  return mano;
}
