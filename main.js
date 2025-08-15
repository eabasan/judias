import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { crearMazo, repartirCartas } from './mazo.js';

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

let nombreJugador = "";
let idPartida = "";
let mazo = [];
let manoJugador = [];

document.getElementById("guardarNombre").onclick = () => {
  nombreJugador = document.getElementById("nombre").value.trim();
  if(!nombreJugador) return alert("Introduce tu nombre");
  alert("Nombre guardado: " + nombreJugador);
};

document.getElementById("crearPartida").onclick = async () => {
  if(!nombreJugador) return alert("Primero guarda tu nombre");
  idPartida = Math.random().toString(36).substring(2,7).toUpperCase();
  await setDoc(doc(db, "partidas", idPartida), { 
    jugadores: [nombreJugador],
    campos: { [nombreJugador]: [[],[],[]] } 
  });
  alert("Partida creada. Código: " + idPartida);
  mazo = crearMazo();
  manoJugador = repartirCartas(mazo, 5);
  renderMano();
  escucharPartida();
};

document.getElementById("unirsePartida").onclick = async () => {
  if(!nombreJugador) return alert("Primero guarda tu nombre");
  idPartida = document.getElementById("codigoPartida").value.trim().toUpperCase();
  const partidaRef = doc(db, "partidas", idPartida);
  const snap = await getDoc(partidaRef);
  if(!snap.exists()) return alert("Código de partida no válido");
  await updateDoc(partidaRef, { 
    jugadores: arrayUnion(nombreJugador),
    [`campos.${nombreJugador}`]: [[],[],[]]
  });
  mazo = crearMazo();
  manoJugador = repartirCartas(mazo,5);
  renderMano();
  escucharPartida();
};

function renderMano() {
  const container = document.getElementById("cartasJugador");
  container.innerHTML = "";
  manoJugador.forEach((carta, i) => {
    const div = document.createElement("div");
    div.className = "carta " + carta.nombre.toLowerCase().replace(/\s/g,'-');
    div.textContent = carta.nombre;
    div.onclick = () => plantarCarta(i);
    container.appendChild(div);
  });
}

async function escucharPartida() {
  const partidaRef = doc(db, "partidas", idPartida);
  onSnapshot(partidaRef, (snap) => {
    if(!snap.exists()) return;
    const data = snap.data();
    renderCampos(data.campos);
    const jugadoresList = document.getElementById("listaJugadores");
    jugadoresList.innerHTML = "";
    data.jugadores.forEach(j => {
      const li = document.createElement("li");
      li.textContent = j;
      jugadoresList.appendChild(li);
    });
  });
}

function renderCampos(camposData) {
  const container = document.getElementById("camposContainer");
  container.innerHTML = "";
  Object.keys(camposData).forEach(jugador => {
    const divJugador = document.createElement("div");
    divJugador.innerHTML = `<h4>${jugador}</h4>`;
    camposData[jugador].forEach((campo, i) => {
      const divCampo = document.createElement("div");
      divCampo.className = "campo";
      divCampo.innerHTML = `<strong>Campo ${i+1}</strong><br>` + campo.map(c => `<div class="carta ${c.nombre.toLowerCase().replace(/\s/g,'-')}">${c.nombre}</div>`).join("");
      divJugador.appendChild(divCampo);
    });
    container.appendChild(divJugador);
  });
}

async function plantarCarta(indexCarta) {
  const carta = manoJugador[indexCarta];
  const partidaRef = doc(db, "partidas", idPartida);
  const snap = await getDoc(partidaRef);
  const camposJugador = snap.data().campos[nombreJugador];

  // Intentar plantar en el primer campo posible
  let plantado = false;
  for(let i=0;i<camposJugador.length;i++){
    if(camposJugador[i].length === 0 || camposJugador[i][0].nombre === carta.nombre){
      camposJugador[i].push(carta);
      plantado = true;
      break;
    }
  }

  if(!plantado) return alert("No se puede plantar esta judía en ningún campo");

  // Actualizar Firestore
  await updateDoc(partidaRef, { [`campos.${nombreJugador}`]: camposJugador });

  // Quitar de la mano
  manoJugador.splice(indexCarta,1);
  renderMano();
}
