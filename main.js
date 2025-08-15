import { crearMazo, repartirCartas } from './mazo.js';

let mazo = [];
let jugadores = {};
let partidaIniciada = false;

const manoContainer = document.getElementById('mano');
const contenedorJugadores = document.getElementById('contenedor-jugadores');
const crearPartidaBtn = document.getElementById('crear-partida');
const unirsePartidaBtn = document.getElementById('unirse-partida');
const nombreJugadorInput = document.getElementById('nombre-jugador');

crearPartidaBtn.addEventListener('click', () => {
  const nombre = nombreJugadorInput.value.trim();
  if (!nombre) return alert("Introduce un nombre");
  if (partidaIniciada) return alert("La partida ya ha sido creada");
  
  // Crear mazo y primer jugador
  mazo = crearMazo();
  jugadores[nombre] = {
    mano: repartirCartas(mazo, 5),
    campos: [[], [], []]
  };
  partidaIniciada = true;
  mostrarCampos(jugadores);
  mostrarMano(nombre);
  nombreJugadorInput.value = "";
});

unirsePartidaBtn.addEventListener('click', () => {
  const nombre = nombreJugadorInput.value.trim();
  if (!nombre) return alert("Introduce un nombre");
  if (!partidaIniciada) return alert("Primero crea la partida");
  if (jugadores[nombre]) return alert("Ya existe un jugador con ese nombre");

  jugadores[nombre] = {
    mano: repartirCartas(mazo, 5),
    campos: [[], [], []]
  };
  mostrarCampos(jugadores);
  mostrarMano(nombre); // Cada jugador ve su mano
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

    todosLosCampos[jugador].campos.forEach(campo => {
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

  // Plantar en primer campo disponible (igual tipo o vacío)
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
