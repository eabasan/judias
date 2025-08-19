import { crearMazo, repartirCartas } from './mazo.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCA_tuTWdV8GJuzBbRgzOIyPszHR-kgpe4",
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
// Variable campos ya no es un array anidado, sino un objeto
let campos = {}; 
let mazo = [];
let turnoActual = '';

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
const mensajeTurno = document.getElementById('mensajeTurno');
const partidaInfoDiv = document.getElementById('partidaInfo');

// Función para guardar el nombre del jugador
guardarNombreBtn.addEventListener('click', () => {
    const nombre = nombreInput.value.trim();
    if (!nombre) {
        alert("Introduce tu nombre.");
        return;
    }
    nombreJugador = nombre;
    opcionesDiv.style.display = 'block';
    nombreInput.style.display = 'none';
    guardarNombreBtn.style.display = 'none';
    
    const params = new URLSearchParams(window.location.search);
    const codigoDeURL = params.get('codigo');
    if (codigoDeURL) {
        unirseAPartida(codigoDeURL);
    }
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
        if (nombreJugador === turnoActual) {
            div.addEventListener('click', () => plantarCarta(i));
        } else {
            div.style.opacity = 0.5;
            div.style.cursor = 'not-allowed';
        }
        manoContainer.appendChild(div);
    });
}

// Render campos
function renderCampos() {
    camposContainer.innerHTML = '';
    // Iterar sobre los campos del objeto
    Object.keys(campos).forEach(campoKey => {
        const campo = campos[campoKey];
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
            div.textContent = `Campo vacío`;
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
    for (let j = 1; j <= 3; j++) {
        const campoKey = `campo${j}`;
        // Comprobar si el campo está vacío o si la primera carta coincide
        if (campos[campoKey].length === 0 || campos[campoKey][0].nombre === cartaAPlantar.nombre) {
            campos[campoKey].push(cartaAPlantar);
            planted = true;
            break;
        }
    }

    if (planted) {
        mano.splice(i, 1);
        await actualizarEstadoJugador();
    } else {
        alert('No puedes plantar esta judía en ningún campo existente. Necesitas un campo vacío o uno con el mismo tipo de judía.');
    }
}

// Iniciar el listener de la partida para todos los jugadores
function iniciarListenerPartida() {
    onSnapshot(doc(db, 'partidas', codigoPartida), snapshot => {
        if (snapshot.exists()) {
            const partidaData = snapshot.data();
            
            mazo = partidaData.mazo || [];
            turnoActual = partidaData.turnoActual;
            mensajeTurno.textContent = `Turno de: ${turnoActual}`;

            const miData = partidaData.jugadores[nombreJugador];
            if (miData) {
                mano = miData.mano;
                // Los campos ahora son un objeto
                campos = miData.campos; 
                renderMano();
                renderCampos();
            }

            listaJugadores.innerHTML = '';
            Object.keys(partidaData.jugadores).forEach(jug => {
                const li = document.createElement('li');
                li.textContent = jug;
                listaJugadores.appendChild(li);
            });
        }
    });
}

// Función para crear la partida
crearBtn.addEventListener('click', async () => {
    if (!nombreJugador) {
        alert("Primero guarda tu nombre.");
        return;
    }

    codigoPartida = generarCodigo();
    const mazoCompleto = crearMazo();
    const { mano: manoInicial, mazoActualizado } = repartirCartas(mazoCompleto, 5);
    
    // Nueva estructura para los campos
    const camposIniciales = {
        campo1: [],
        campo2: [],
        campo3: []
    };
    
    try {
        await setDoc(doc(db, 'partidas', codigoPartida), {
            jugadores: {
                [nombreJugador]: { mano: manoInicial, campos: camposIniciales, oro: 0 }
            },
            mazo: mazoActualizado,
            turnoActual: nombreJugador
        });
        
        const enlacePartida = `${window.location.href.split('?')[0]}?codigo=${codigoPartida}`;
        partidaInfoDiv.innerHTML = `
            Código de partida: <strong>${codigoPartida}</strong><br>
            Comparte este enlace: <a href="${enlacePartida}" target="_blank">${enlacePartida}</a>
        `;
        opcionesDiv.style.display = 'none';
        iniciarListenerPartida();

    } catch (error) {
        console.error("Error al crear la partida:", error);
        alert("Hubo un error al crear la partida. Inténtalo de nuevo.");
    }
});

// Función para unirse a la partida
async function unirseAPartida(codigo) {
    if (!nombreJugador) {
        alert("Primero guarda tu nombre.");
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
    const { mano: nuevaMano, mazoActualizado } = repartirCartas(mazoRestante, 5);
    
    // Nueva estructura para los campos al unirse
    const camposIniciales = {
        campo1: [],
        campo2: [],
        campo3: []
    };
    
    try {
        await updateDoc(partidaRef, {
            jugadores: {
                ...partidaData.jugadores,
                [nombreJugador]: { mano: nuevaMano, campos: camposIniciales, oro: 0 }
            },
            mazo: mazoActualizado
        });

        const enlacePartida = `${window.location.href.split('?')[0]}?codigo=${codigoPartida}`;
        partidaInfoDiv.innerHTML = `
            Código de partida: <strong>${codigoPartida}</strong><br>
            Compartir enlace: <a href="${enlacePartida}" target="_blank">${enlacePartida}</a>
        `;
        opcionesDiv.style.display = 'none';
        iniciarListenerPartida();

    } catch (error) {
        console.error("Error al unirse a la partida:", error);
        alert("Hubo un error al unirte a la partida. Inténtalo de nuevo.");
    }
}

// Evento para unirse a una partida con un código
unirseBtn.addEventListener('click', () => {
    const codigo = codigoInput.value.trim();
    if (!codigo) {
        alert('Introduce el código de la partida.');
        return;
    }
    unirseAPartida(codigo);
});

// Comprobar la URL al cargar la página para la unión automática
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const codigoDeURL = params.get('codigo');
    if (codigoDeURL) {
        opcionesDiv.style.display = 'none';
        nombreInput.style.display = 'block';
        guardarNombreBtn.style.display = 'block';
        alert("Se te ha invitado a una partida. Por favor, introduce tu nombre.");
    }
});