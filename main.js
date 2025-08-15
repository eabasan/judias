import { crearMazo, repartirCartas } from './mazo.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCA_tuTWdV8GJuzBbRgzOIyPszHR-kgpe4",
  authDomain: "judias.firebaseapp.com",
  projectId: "judias",
  storageBucket: "judias.firebasestorage.app",
  messagingSenderId: "1061180491958",
  appId: "1:1061180491958:web:4bbd99457a56e58f34be17",
  measurementId: "G-G3Y5NZWBEE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let nombreJugador;
let codigoPartida;
let mano = [];
let campos = [[], [], []]; // 3 campos por jugador
let mazo = [];

const nombreInput = document.getElementById('nombre');
const crearBtn = document.getElementById('crearPartida');
const unirseBtn = document.getElementById('unirsePartida');
const codigoInput = document.getElementById('codigo');
const codigoContainer = document.getElementById('codigoPartidaContainer');
const manoContainer = document.getElementById('manoContainer');
const camposContainer = document.getElementById('camposContainer');

function generarCodigo() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function renderMano() {
  manoContainer.innerHTML = '';
  mano.forEach((carta, index) => {
    const div = document.createElement('div');
    div.className = `carta ${carta.nombre.toLowerCase().replace(/ /g,'-')}`;
    div.textContent = carta.nombre;
    div.addEventListener('click', () => plantarCarta(index));
    manoContainer.appendChild(div);
  });
}

function renderCampos(jugadores) {
  camposContainer.innerHTML = '';
  jugadores.forEach(jugador => {
    const jugadorDiv = document.createElement('div');
    jugadorDiv.className = 'jugador';
    const nombreP = document.createElement('p');
    nombreP.textContent = jugador.nombre;
    jugadorDiv.appendChild(nombreP);

    const camposDiv = document.createElement('div');
    camposDiv.className = 'campos';
    jugador.campos.forEach(campo => {
      const campoDiv = document.createElement('div');
      campoDiv.className = 'campo';
      campo.forEach(c => {
        const cartaDiv = document.createElement('div');
        cartaDiv.className = `carta ${c.nombre.toLowerCase().replace(/ /g,'-')}`;
        cartaDiv.textContent = c.nombre;
        campoDiv.appendChild(cartaDiv);
      });
      camposDiv.appendChild(campoDiv);
    });
    jugadorDiv.appendChild(camposDiv);
    camposContainer.appendChild(jugadorDiv);
  });
}

function plantarCarta(indiceCarta) {
  const carta = mano[indiceCarta];
  // Intentar plantar en primer campo vacío o con misma judía
  let planted = false;
  for (let i = 0; i < 3; i++) {
    if (campos[i].length === 0 || campos[i][0].nombre === carta.nombre) {
      campos[i].push(carta);
      planted = true;
      break;
    }
  }
  if (planted) {
    mano.splice(indiceCarta,1);
    renderMano();
    actualizarCamposEnFirestore();
  } else {
    alert('No puedes plantar esta judía en ningún campo.');
  }
}

// Actualiza los campos del jugador en Firestore
async function actualizarCamposEnFirestore() {
  if (!codigoPartida) return;
  const partidaRef = doc(db, 'partidas', codigoPartida);
  const partidaSnap = await getDoc(partidaRef);
  if (!partidaSnap.exists()) return;
  const data = partidaSnap.data();
  const jugadores = data.jugadores.map(j => j.nombre === nombreJugador ? {nombre: nombreJugador, mano, campos} : j);
  await updateDoc(partidaRef, { jugadores });
}

crearBtn.addEventListener('click', async () => {
  nombreJugador = nombreInput.value.trim();
  if (!nombreJugador) return alert('Pon tu nombre');
  codigoPartida = generarCodigo();
  mazo = crearMazo();
  mano = repartirCartas(mazo,5);
  campos = [[],[],[]];
  renderMano();
  renderCampos([{nombre: nombreJugador, campos}]);
  codigoContainer.textContent = `Código de partida: ${codigoPartida}`;

  try {
    await setDoc(doc(db, 'partidas', codigoPartida), {
      jugadores: [{nombre: nombreJugador, mano, campos}],
      mazo
    });
    escucharPartida(); // escucha en tiempo real
  } catch(e) {
    console.error(e);
  }
});

unirseBtn.addEventListener('click', async () => {
  nombreJugador = nombreInput.value.trim();
  if (!nombreJugador) return alert('Pon tu nombre');
  const codigo = codigoInput.value.trim();
  if (!codigo) return alert('Pon el código');

  const partidaRef = doc(db, 'partidas', codigo);
  const partidaSnap = await getDoc(partidaRef);
  if (!partidaSnap.exists()) return alert('Partida no encontrada');

  const partidaData = partidaSnap.data();
  mazo = partidaData.mazo;
  mano = repartirCartas(mazo,5);
  campos = [[],[],[]];
  codigoPartida = codigo;

  // Añadir jugador si no existe
  if (!partidaData.jugadores.some(j => j.nombre === nombreJugador)) {
    partidaData.jugadores.push({nombre: nombreJugador, mano, campos});
    await updateDoc(partidaRef, { jugadores: partidaData.jugadores });
  }

  renderMano();
  renderCampos(partidaData.jugadores);
  codigoContainer.textContent = `Te uniste a la partida ${codigo}`;

  escucharPartida();
});

// Función para escuchar cambios en tiempo real
function escucharPartida() {
  if (!codigoPartida) return;
  const partidaRef = doc(db, 'partidas', codigoPartida);
  onSnapshot(partidaRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    // Actualiza campos de todos
    renderCampos(data.jugadores);
    // Actualiza tu mano si ha cambiado (por ejemplo tras plantar)
    const yo = data.jugadores.find(j => j.nombre === nombreJugador);
    if (yo) {
      mano = yo.mano;
      campos = yo.campos;
      renderMano();
    }
  });
}
