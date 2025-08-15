// main.js
import { crearMazo, repartirCartas } from './mazo.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let jugadorNombre = '';
let jugadorId = '';
let partidaCodigo = '';
let mano = [];
let mazo = [];

const crearBtn = document.getElementById('crearPartida');
const unirseBtn = document.getElementById('unirsePartida');
const nombreInput = document.getElementById('nombre');
const codigoInput = document.getElementById('codigo');
const camposContainer = document.getElementById('camposContainer');
const manoContainer = document.getElementById('manoContainer');

// Genera código único
function generarCodigo(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Crear partida
crearBtn.addEventListener('click', async () => {
  jugadorNombre = nombreInput.value.trim();
  if (!jugadorNombre) return alert("Escribe tu nombre");

  partidaCodigo = generarCodigo();
  jugadorId = 'jugador_' + Math.floor(Math.random() * 10000);

  mazo = crearMazo();
  mano = repartirCartas(mazo, 5);

  // Campos iniciales como objetos con array de cartas
  const camposIniciales = [
    { cartas: [] },
    { cartas: [] },
    { cartas: [] }
  ];

  const partidaData = {
    codigo: partidaCodigo,
    mazo,
    jugadores: {
      [jugadorId]: {
        nombre: jugadorNombre,
        campos: camposIniciales,
        mano
      }
    }
  };

  try {
    await setDoc(doc(db, "partidas", partidaCodigo), partidaData);
    alert(`Partida creada. Código: ${partidaCodigo}`);
    mostrarMano();
    escucharPartida();
  } catch (err) {
    console.error(err);
    alert("Error al crear la partida");
  }
});

// Unirse a partida
unirseBtn.addEventListener('click', async () => {
  jugadorNombre = nombreInput.value.trim();
  if (!jugadorNombre) return alert("Escribe tu nombre");

  partidaCodigo = codigoInput.value.trim();
  if (!partidaCodigo) return alert("Escribe el código de la partida");

  jugadorId = 'jugador_' + Math.floor(Math.random() * 10000);

  try {
    const partidaRef = doc(db, "partidas", partidaCodigo);
    const partidaSnap = await getDoc(partidaRef);
    if (!partidaSnap.exists()) return alert("Partida no encontrada");

    mazo = repartirCartas(partidaSnap.data().mazo, 0); // no robar de mazo aún
    mano = repartirCartas(mazo, 5);

    const camposIniciales = [
      { cartas: [] },
      { cartas: [] },
      { cartas: [] }
    ];

    await updateDoc(partidaRef, {
      [`jugadores.${jugadorId}`]: {
        nombre: jugadorNombre,
        campos: camposIniciales,
        mano
      }
    });

    mostrarMano();
    escucharPartida();

  } catch (err) {
    console.error(err);
    alert("Error al unirse a la partida");
  }
});

// Mostrar la mano
function mostrarMano() {
  manoContainer.innerHTML = '';
  mano.forEach((carta, index) => {
    const div = document.createElement('div');
    div.className = `carta ${carta.nombre.toLowerCase().replace(/\s/g, '-')}`;
    div.textContent = carta.nombre;
    div.addEventListener('click', () => plantarCarta(index));
    manoContainer.appendChild(div);
  });
}

// Escuchar cambios de la partida en tiempo real
function escucharPartida() {
  const partidaRef = doc(db, "partidas", partidaCodigo);
  onSnapshot(partidaRef, (snapshot) => {
    const data = snapshot.data();
    mostrarCampos(data.jugadores);
  });
}

// Renderizar campos de todos los jugadores
function mostrarCampos(jugadores) {
  camposContainer.innerHTML = '';
  for (let id in jugadores) {
    const jugador = jugadores[id];
    const divJugador = document.createElement('div');
    divJugador.className = 'jugador';
    const nombre = document.createElement('h3');
    nombre.textContent = jugador.nombre;
    divJugador.appendChild(nombre);

    const camposDiv = document.createElement('div');
    camposDiv.className = 'campos';
    jugador.campos.forEach((campo, idx) => {
      const campoDiv = document.createElement('div');
      campoDiv.className = 'campo';
      campoDiv.innerHTML = campo.cartas.map(c => `<div class="carta ${c.toLowerCase().replace(/\s/g,'-')}">${c}</div>`).join('');
      campoDiv.innerHTML = `<strong>Campo ${idx+1}</strong><br>` + campoDiv.innerHTML;
      camposDiv.appendChild(campoDiv);
    });

    divJugador.appendChild(camposDiv);
    camposContainer.appendChild(divJugador);
  }
}

// Plantar carta
async function plantarCarta(indexMano) {
  if (!mano[indexMano]) return;

  const carta = mano[indexMano];
  const partidaRef = doc(db, "partidas", partidaCodigo);
  const partidaSnap = await getDoc(partidaRef);
  const jugadorData = partidaSnap.data().jugadores[jugadorId];

  // Intentar plantar en primer campo disponible
  let campoPlantado = false;
  for (let campo of jugadorData.campos) {
    if (campo.cartas.length === 0 || campo.cartas[0] === carta.nombre) {
      campo.cartas.push(carta.nombre);
      campoPlantado = true;
      break;
    }
  }
  if (!campoPlantado) return alert("No puedes plantar esta carta ahora");

  // Quitar carta de la mano
  mano.splice(indexMano, 1);

  // Actualizar Firestore
  await updateDoc(partidaRef, {
    [`jugadores.${jugadorId}.mano`]: mano,
    [`jugadores.${jugadorId}.campos`]: jugadorData.campos
  });
  mostrarMano();
}
