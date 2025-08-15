import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { crearMazo, repartirCartas } from "./mazo.js";

// Configura tu Firebase
const firebaseConfig = {
  apiKey: "TU_APIKEY",
  authDomain: "TU_AUTHDOMAIN",
  projectId: "TU_PROJECTID",
  storageBucket: "TU_STORAGEBUCKET",
  messagingSenderId: "TU_MESSAGINGSENDERID",
  appId: "TU_APPID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const nombreInput = document.getElementById("nombre");
const crearBtn = document.getElementById("crearPartida");
const unirseBtn = document.getElementById("unirsePartida");
const codigoInput = document.getElementById("codigo");
const manoContainer = document.getElementById("manoContainer");
const camposContainer = document.getElementById("camposContainer");

let jugador = null;
let codigoPartida = null;
let mano = [];

// Función para generar código aleatorio de 4 letras/números
function generarCodigo() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Crear partida
crearBtn.addEventListener("click", async () => {
  if (!nombreInput.value) return alert("Escribe tu nombre");
  jugador = nombreInput.value;
  codigoPartida = generarCodigo();

  const mazo = crearMazo();
  const manoInicial = repartirCartas(mazo, 5);

  await setDoc(doc(db, "partidas", codigoPartida), {
    jugadores: [{ nombre: jugador, campos: [[],[],[]], mano: manoInicial }],
    mazo: mazo
  });

  alert(`Partida creada! Código: ${codigoPartida}`);
  mostrarMano(manoInicial);
  renderCampos([{ nombre: jugador, campos: [[],[],[]] }]);
});

// Unirse a partida
unirseBtn.addEventListener("click", async () => {
  if (!nombreInput.value || !codigoInput.value) return alert("Escribe tu nombre y el código");
  jugador = nombreInput.value;
  codigoPartida = codigoInput.value.toUpperCase();

  const partidaRef = doc(db, "partidas", codigoPartida);
  const partidaSnap = await getDoc(partidaRef);
  if (!partidaSnap.exists()) return alert("Partida no encontrada");

  const partidaData = partidaSnap.data();
  const mazo = partidaData.mazo;
  const manoInicial = repartirCartas(mazo, 5);

  await updateDoc(partidaRef, {
    jugadores: arrayUnion({ nombre: jugador, campos: [[],[],[]], mano: manoInicial })
  });

  alert(`Te has unido a la partida ${codigoPartida}`);
  mostrarMano(manoInicial);
  renderCampos(partidaData.jugadores.concat({ nombre: jugador, campos: [[],[],[]] }));
});

// Renderizar mano
function mostrarMano(cartas) {
  manoContainer.innerHTML = "";
  cartas.forEach(carta => {
    const div = document.createElement("div");
    div.classList.add("carta");
    div.classList.add(cartaClass(carta.nombre));
    div.textContent = carta.nombre;
    manoContainer.appendChild(div);
  });
}

// Renderizar campos de todos los jugadores
function renderCampos(jugadores) {
  camposContainer.innerHTML = "";
  jugadores.forEach(j => {
    const divJugador = document.createElement("div");
    divJugador.classList.add("jugador");
    const h3 = document.createElement("h3");
    h3.textContent = j.nombre;
    divJugador.appendChild(h3);

    const divCampos = document.createElement("div");
    divCampos.classList.add("campos");

    j.campos.forEach((campo, i) => {
      const divCampo = document.createElement("div");
      divCampo.classList.add("campo");
      divCampo.dataset.jugador = j.nombre;
      divCampo.dataset.campo = i;
      campo.forEach(carta => {
        const c = document.createElement("div");
        c.classList.add("carta");
        c.classList.add(cartaClass(carta.nombre));
        c.textContent = carta.nombre;
        divCampo.appendChild(c);
      });
      divCampos.appendChild(divCampo);
    });

    divJugador.appendChild(divCampos);
    camposContainer.appendChild(divJugador);
  });
}

// Clase CSS para cada judía
function cartaClass(nombre) {
  return nombre.toLowerCase().replace(/ /g, "-");
}
