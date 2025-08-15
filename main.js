import { crearMazo, repartirCartas } from './mazo.js';

let mazo = [];
let jugadores = {};
let turno = 0;

const manoContainer = document.getElementById('mano');
const contenedorJugadores = document.getElementById('contenedor-jugadores');
const crearPartidaBtn = document.getElementById('crear-partida');
const nombreJugadorInput = document.getElementById('nombre-jugador');

crearPartidaBtn.addEventListener('click', () => {
  const nombre = nombreJugadorInput.value.trim();
  if (!nombre) return alert("Introduce un nombre");
  if (jugadores[nombre]) return alert("Ya existe un jugador con ese nombre");

  if (Object.keys(jugadores).length === 0) {
    mazo = crearMazo(); // Solo crear mazo al iniciar
  }

  jugadores[nombre] = {
    mano: repartirCartas(mazo, 5),
    campos: [[], [], []] // 3 campos vacíos
  };

  mostrarCampos(jugadores);
  mostrarMano(nombre);
  nombreJugadorInput.value = "";
});

function mostrarCampos(todosLosCampos) {
  contenedorJugadores.innerHTML = "";

  for (const jugador in todosLosCampos) {
    const divJugador = document.createElement("div");
    divJugador.classList.add("jugador");

    const h4 = document.createElement("h4");
    h4.textContent = jugador;
    divJugador.appendChild(h4);

    // 3 campos
    todosLosCampos[jugador].campos.forEach((campo) => {
      const campoDiv = document.createElement("div");
      campoDiv.classList.add("campo");

      campo.forEach(carta => {
        const cDiv = document.createElement("div");
        cDiv.textContent = carta.nombre;
        cDiv.className = "carta " + carta.nombre.toLowerCase().replace(/\s/g,'-');
        campoDiv.appendChild(cDiv);
      });

      divJugador.appendChild(campoDiv);
    });

    contenedorJugadores.appendChild(divJugador);
  }
}

function mostrarMano(nombreJugador) {
  manoContainer.innerHTML = "";
  const mano = jugadores[nombreJugador].mano;

  mano.forEach((carta, index) => {
    const cDiv = document.createElement("div");
    cDiv.textContent = carta.nombre;
    cDiv.className = "carta " + carta.nombre.toLowerCase().replace(/\s/g,'-');
    cDiv.addEventListener('click', () => {
      plantarCarta(nombreJugador, index);
    });
    manoContainer.appendChild(cDiv);
  });
}

function plantarCarta(nombreJugador, indiceCarta) {
  const jugador = jugadores[nombreJugador];
  const carta = jugador.mano[indiceCarta];

  // Plantar en primer campo disponible (puedes mejorar la lógica)
  for (let campo of jugador.campos) {
    if (campo.length === 0 || campo[0].nombre === carta.nombre) {
      campo.push(carta);
      jugador.mano.splice(indiceCarta, 1);
      mostrarCampos(jugadores);
      mostrarMano(nombreJugador);
      return;
    }
  }

  alert("No puedes plantar esa judía en ningún campo disponible");
}
