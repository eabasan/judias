import { crearMazo, repartirCartas } from './mazo.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Config Firebase (¡Asegúrate de que esta configuración es correcta para tu proyecto!)
const firebaseConfig = {
    apiKey: "AIzaSyCA_tuTWdV8GJuzBbRgzOIyPszHR-kgpe4", // ¡Revisa tu API Key!
    authDomain: "judias.firebaseapp.com",
    projectId: "judias",
    storageBucket: "judias.appspot.com",
    messagingSenderId: "1061180491958",
    appId: "1:1061180491958:web:4bbd99457a56e58f34be17"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables del juego
let nombreJugador = '';
let codigoPartida = '';
let mano = [];
let campos = [[], [], []];
let mazo = []; // Mazo de la partida, se gestiona en Firebase
let turnoActual = ''; // Nombre del jugador al que le toca el turno

// Elementos DOM
const nombreInput = document.getElementById('nombre');
const guardarNombreBtn = document.getElementById('guardarNombre');
const opcionesDiv = document.getElementById('opciones');
const crearBtn = document.getElementById('crearPartida');
const unirseBtn = document.getElementById('unirsePartida');
const codigoInput = document.getElementById('codigo');
const codigoContainer = document.getElementById('codigoPartidaContainer');
const manoContainer = document.getElementById('manoContainer');
const camposContainer = document.getElementById('camposContainer');
const listaJugadores = document.getElementById('listaJugadores');
const mensajeTurno = document.getElementById('mensajeTurno'); // Nuevo elemento para el turno

// Guardar nombre
guardarNombreBtn.addEventListener('click', () => {
    const nombre = nombreInput.value.trim();
    if (!nombre) {
        alert("Introduce tu nombre.");
        return;
    }
    nombreJugador = nombre;
    alert("Nombre guardado: " + nombreJugador);
    opcionesDiv.style.display = 'block';
    nombreInput.style.display = 'none'; // Ocultar input de nombre
    guardarNombreBtn.style.display = 'none'; // Ocultar botón de guardar nombre
});

// Generar código
function generarCodigo() {
    return Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Render mano
function renderMano() {
    manoContainer.innerHTML = '';
    mano.forEach((carta, i) => {
        const div = document.createElement('div');
        div.className = `carta ${carta.nombre.toLowerCase().replace(/\s/g, '-')}`;
        div.textContent = carta.nombre;
        // Solo permitir plantar si es tu turno
        if (nombreJugador === turnoActual) {
            div.addEventListener('click', () => plantarCarta(i));
        } else {
            div.style.opacity = 0.5; // Visualmente indicar que no es su turno
            div.style.cursor = 'not-allowed';
        }
        manoContainer.appendChild(div);
    });
}

// Render campos
function renderCampos() {
    camposContainer.innerHTML = '';
    campos.forEach((campo, i) => {
        const div = document.createElement('div');
        div.className = 'campo';
        if (campo.length > 0) {
            campo.forEach(c => {
                const cartaDiv = document.createElement('div');
                cartaDiv.textContent = c.nombre;
                cartaDiv.className = `carta ${c.nombre.toLowerCase().replace(/\s/g, '-')}`;
                div.appendChild(cartaDiv);
            });
        } else {
            div.textContent = `Campo ${i + 1} vacío`;
            div.style.color = '#aaa';
            div.style.fontSize = '14px';
        }
        camposContainer.appendChild(div);
    });
}

// Actualizar el estado del jugador en Firebase
async function actualizarEstadoJugador() {
    if (!codigoPartida || !nombreJugador) return;

    const partidaRef = doc(db, 'partidas', codigoPartida);
    await updateDoc(partidaRef, {
        [`jugadores.${nombreJugador}.mano`]: mano,
        [`jugadores.${nombreJugador}.campos`]: campos
        // Otros estados del jugador como el oro se actualizarían aquí
    });
}

// Plantar carta
async function plantarCarta(i) {
    if (nombreJugador !== turnoActual) {
        alert('No es tu turno para plantar.');
        return;
    }

    const cartaAPlantar = mano[i];
    let planted = false;
    for (let j = 0; j < campos.length; j++) {
        if (campos[j].length === 0 || campos[j][0].nombre === cartaAPlantar.nombre) {
            campos[j].push(cartaAPlantar);
            planted = true;
            break;
        }
    }

    if (planted) {
        mano.splice(i, 1);
        await actualizarEstadoJugador(); // Guardar el cambio en Firebase
        // Podrías pasar el turno aquí o en una fase posterior del juego
    } else {
        alert('No puedes plantar esta judía en ningún campo existente. Necesitas un campo vacío o uno con el mismo tipo de judía.');
    }
}

// Crear partida
crearBtn.addEventListener('click', async () => {
    codigoPartida = generarCodigo();
    mazo = crearMazo(); // El mazo inicial se crea aquí
    mano = repartirCartas(mazo, 5); // Repartir mano inicial al creador

    // Establecer el estado inicial de la partida en Firebase
    await setDoc(doc(db, 'partidas', codigoPartida), {
        jugadores: {
            [nombreJugador]: { mano, campos: [[], [], []], oro: 0 } // Estado del creador
        },
        mazo: mazo, // Guardar el mazo completo
        turnoActual: nombreJugador // El creador empieza el turno
    });

    codigoContainer.textContent = `Código de partida: ${codigoPartida}`;
    opcionesDiv.style.display = 'none'; // Ocultar opciones al crear/unirse

    // Escuchar la partida en tiempo real
    onSnapshot(doc(db, 'partidas', codigoPartida), snapshot => {
        if (snapshot.exists()) {
            const partidaData = snapshot.data();
            
            // Actualizar el estado global del mazo y turno
            mazo = partidaData.mazo || []; // Asegurarse de que el mazo exista
            turnoActual = partidaData.turnoActual;
            mensajeTurno.textContent = `Turno de: ${turnoActual}`;

            // Actualizar la mano y campos locales del jugador actual con los datos de Firebase
            const miData = partidaData.jugadores[nombreJugador];
            if (miData) {
                mano = miData.mano;
                campos = miData.campos;
                renderMano();
                renderCampos();
            }

            // Actualizar la lista de jugadores
            listaJugadores.innerHTML = '';
            // Object.keys(partidaData.jugadores) devolverá un array con los nombres de los jugadores
            Object.keys(partidaData.jugadores).forEach(jug => {
                const li = document.createElement('li');
                li.textContent = jug;
                listaJugadores.appendChild(li);
            });
        }
    });
});

// Unirse a partida
unirseBtn.addEventListener('click', async () => {
    const codigo = codigoInput.value.trim();
    if (!codigo) {
        alert('Introduce el código de la partida.');
        return;
    }
    codigoPartida = codigo;

    const partidaRef = doc(db, 'partidas', codigo);
    const partidaSnapshot = await getDoc(partidaRef);

    if (!partidaSnapshot.exists()) {
        alert('La partida no existe o el código es incorrecto.');
        return;
    }

    const partidaData = partidaSnapshot.data();
    let mazoRestante = partidaData.mazo;

    // Repartir 5 cartas del mazo a este nuevo jugador
    const { mano: nuevaMano, mazoActualizado } = repartirCartas(mazoRestante, 5);
    mano = nuevaMano;
    mazoRestante = mazoActualizado;

    // Actualizar el documento de la partida con el nuevo jugador y el mazo actualizado
    await updateDoc(partidaRef, {
        jugadores: {
            ...partidaData.jugadores, // Mantener los jugadores existentes
            [nombreJugador]: { mano, campos: [[], [], []], oro: 0 } // Añadir al nuevo jugador
        },
        mazo: mazoRestante // Actualizar el mazo global de la partida
    });

    codigoContainer.textContent = `Código de partida: ${codigoPartida}`;
    opcionesDiv.style.display = 'none'; // Ocultar opciones al crear/unirse

    // Escuchar cambios en tiempo real
    onSnapshot(partidaRef, snapshot => {
        if (snapshot.exists()) {
            const partidaData = snapshot.data();

            // Actualizar el estado global del mazo y turno
            mazo = partidaData.mazo || [];
            turnoActual = partidaData.turnoActual;
            mensajeTurno.textContent = `Turno de: ${turnoActual}`;

            // Actualizar la mano y campos locales del jugador actual
            const miData = partidaData.jugadores[nombreJugador];
            if (miData) {
                mano = miData.mano;
                campos = miData.campos;
                renderMano();
                renderCampos();
            }

            // Actualizar la lista de jugadores
            listaJugadores.innerHTML = '';
            Object.keys(partidaData.jugadores).forEach(jug => {
                const li = document.createElement('li');
                li.textContent = jug;
                listaJugadores.appendChild(li);
            });
        }
    });
});