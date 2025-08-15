import { crearMazo, repartirCartas, reconstruirCarta } from './mazo.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

function renderCampos() {
  camposContainer.innerHTML = '';
  const jugadorDiv = document.createElement('div');
  jugadorDiv.className = 'jugador';
  const nombreP = document.createElement('p');
  nombreP.textContent = nombreJugador;
  jugadorDiv.appendChild(nombreP);

  const camposDiv = document.createElement('div');
  camposDiv.className = 'campos';
  campos.forEach(campo => {
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
}

function plantarCarta(indiceCarta) {
  const carta = mano[indiceCarta];
  let planted = false;
  for (let i = 0; i < 3; i++) {
    if (campos[i].length === 0 || campos[i][0].nombre === carta.nombre) {
      campos[i].push(carta);
      planted = true;
      break;
    }
  }
  if (planted) {
    mano.splice(indiceCarta, 1);
    renderMano();
    renderCampos();
  } else {
    alert('No puedes plantar esta judía en ningún campo.');
  }
}

crearBtn.addEventListener('click', async () => {
  nombreJugador = nombreInput.value.trim();
  if (!nombreJugador) return alert('Pon tu nombre');

  codigoPartida = generarCodigo();
  mazo = crearMazo();
  mano = repartirCartas(mazo, 5);
  campos = [[], [], []];
  renderMano();
  renderCampos();
  codigoContainer.textContent = `Código de partida: ${codigoPartida}`;

  try {
    await setDoc(doc(db, 'partidas', codigoPartida), {
      jugadores: [{ nombre: nombreJugador, mano: mano.map(c => c.nombre), campos: [[], [], []] }],
      mazo: mazo.map(c => c.nombre)
    });
  } catch(e) {
    console.error(e);
    alert('Error al crear partida');
  }
});

unirseBtn.addEventListener('click', async () => {
  nombreJugador = nombreInput.value.trim();
  if (!nombreJugador) return alert('Pon tu nombre');

  const codigo = codigoInput.value.trim().toUpperCase();
  if (!codigo) return alert('Pon el código');

  const partidaRef = doc(db, 'partidas', codigo);
  const partidaSnap = await getDoc(partidaRef);

  if (!partidaSnap.exists()) return alert('Partida no encontrada');

  const partidaData = partidaSnap.data();

  // Reconstruir cartas desde nombres
  mazo = partidaData.mazo.map(n => reconstruirCarta(n));
  mano = repartirCartas(mazo, 5);
  campos = [[], [], []];

  renderMano();
  renderCampos();

  await updateDoc(partidaRef, {
    jugadores: arrayUnion({ nombre: nombreJugador, mano: mano.map(c => c.nombre), campos })
  });

  codigoContainer.textContent = `Te uniste a la partida ${codigo}`;
});
