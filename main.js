import { crearMazo, repartirCartas } from './mazo.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
let campos = {}; 
let mazo = [];
let turnoActual = '';
let faseActual = 0; 
let oro = 0;
let cartasDeComercio = []; 
let jugadoresEnPartida = []; // Nuevo: lista de jugadores para el menú de ofertas

// Constante para la tabla de precios de las judías (simplificada)
const PRECIOS = {
    "Judia Bill": [0, 0, 1, 2, 3], 
    "Judia Negra": [0, 0, 1, 2, 3],
    "Judia Marron": [0, 0, 1, 2, 3],
};

// Elementos DOM
const nombreInput = document.getElementById('nombre');
const guardarNombreBtn = document.getElementById('guardarNombre');
const opcionesDiv = document.getElementById('opciones');
const crearBtn = document.getElementById('crearPartida');
const unirseBtn = document.getElementById('unirsePartida');
const codigoInput = document.getElementById('codigo');
const manoContainer = document.getElementById('manoContainer');
const camposContainer = document.getElementById('camposContainer');
const listaJugadores = document.getElementById('listaJugadores');
const mensajeTurno = document.getElementById('mensajeTurno');
const partidaInfoDiv = document.getElementById('partidaInfo');
const todosCamposContainer = document.getElementById('todosCamposContainer');
const pasarTurnoBtn = document.getElementById('pasarTurnoBtn');
const faseInfo = document.getElementById('faseInfo');
const oroInfo = document.getElementById('oroInfo');
const mazoInfo = document.getElementById('mazoInfo'); 
const comercioContainer = document.getElementById('comercioContainer');
const ofertasRecibidasContainer = document.getElementById('ofertasRecibidasContainer'); // Nuevo

// --- Funciones del juego ---

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

function generarCodigo() {
    return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function renderMano() {
    manoContainer.innerHTML = '';
    mano.forEach((carta, i) => {
        const div = document.createElement('div');
        div.className = `carta ${carta.nombre.toLowerCase().replace(/\s/g, '-')}`;
        div.textContent = carta.nombre;

        if (nombreJugador === turnoActual && faseActual === 1 && i === 0) {
            div.addEventListener('click', () => plantarCarta(i));
        } else {
            div.style.opacity = 0.5;
            div.style.cursor = 'not-allowed';
        }
        manoContainer.appendChild(div);
    });
}

function renderCampos() {
    camposContainer.innerHTML = '';
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
            const cosecharBtn = document.createElement('button');
            cosecharBtn.textContent = 'Cosechar';
            cosecharBtn.className = 'cosechar-btn';
            cosecharBtn.addEventListener('click', () => cosecharCampo(campoKey));
            div.appendChild(cosecharBtn);
        } else {
            div.textContent = 'Campo vacío';
            div.style.color = '#aaa';
            div.style.fontSize = '14px';
        }
        camposContainer.appendChild(div);
    });
}

// Renderizar las cartas de comercio
function renderCartasDeComercio() {
    comercioContainer.innerHTML = '';
    if (cartasDeComercio.length > 0) {
        cartasDeComercio.forEach((carta, i) => {
            const div = document.createElement('div');
            div.className = `carta ${carta.nombre.toLowerCase().replace(/\s/g, '-')}`;
            div.innerHTML = `${carta.nombre}<br><button class="ofrecer-btn">Ofrecer</button>`;
            
            // Lógica para ofrecer solo si es el turno del jugador y está en la fase de comercio
            if (nombreJugador === turnoActual && faseActual === 2) {
                div.querySelector('.ofrecer-btn').addEventListener('click', () => {
                    mostrarMenuOferta(i);
                });
            } else {
                 div.querySelector('.ofrecer-btn').style.display = 'none';
            }
            comercioContainer.appendChild(div);
        });
    } else {
        comercioContainer.textContent = 'No hay cartas para intercambiar.';
    }
}

// Nuevo: Menú para ofrecer una carta
function mostrarMenuOferta(cartaIndex) {
    let menuHTML = `<h4>Ofrecer carta a...</h4>`;
    jugadoresEnPartida.forEach(jugador => {
        if (jugador !== nombreJugador) {
            menuHTML += `<button class="ofrecer-a-btn" data-jugador="${jugador}" data-carta-index="${cartaIndex}">${jugador}</button>`;
        }
    });
    comercioContainer.innerHTML = menuHTML;
    comercioContainer.querySelectorAll('.ofrecer-a-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const jugadorDestino = e.target.getAttribute('data-jugador');
            const indexCarta = parseInt(e.target.getAttribute('data-carta-index'));
            ofrecerCarta(indexCarta, jugadorDestino);
        });
    });
}

// Nuevo: Enviar una oferta a Firebase
async function ofrecerCarta(indexCarta, jugadorDestino) {
    const cartaOfrecida = cartasDeComercio[indexCarta];
    const partidaRef = doc(db, 'partidas', codigoPartida);
    
    // Quitar la carta del área de comercio
    const nuevasCartasDeComercio = [...cartasDeComercio];
    nuevasCartasDeComercio.splice(indexCarta, 1);

    await updateDoc(partidaRef, {
        cartasDeComercio: nuevasCartasDeComercio,
        propuestas: {
            [jugadorDestino]: cartaOfrecida
        }
    });
    renderCartasDeComercio();
    alert(`Has ofrecido ${cartaOfrecida.nombre} a ${jugadorDestino}.`);
}

// Nuevo: Aceptar una oferta de Firebase
async function aceptarOferta(carta) {
    // Lógica para plantar la carta en un campo
    let planted = false;
    for (let j = 1; j <= 3; j++) {
        const campoKey = `campo${j}`;
        if (campos[campoKey].length === 0 || campos[campoKey][0].nombre === carta.nombre) {
            campos[campoKey].push(carta);
            planted = true;
            break;
        }
    }
    
    if (planted) {
        // Si se planta con éxito, actualizar el estado del jugador y borrar la propuesta
        const partidaRef = doc(db, 'partidas', codigoPartida);
        await updateDoc(partidaRef, {
            [`jugadores.${nombreJugador}.campos`]: campos,
            [`propuestas.${nombreJugador}`]: null // Eliminar la propuesta
        });
        alert(`Has aceptado y plantado la ${carta.nombre}.`);
    } else {
        alert('No puedes plantar esta judía. Necesitas un campo vacío o con el mismo tipo.');
    }
}


function renderizarTodosLosCampos(jugadoresData) {
    todosCamposContainer.innerHTML = '';
    Object.keys(jugadoresData).forEach(nombre => {
        const jugadorDiv = document.createElement('div');
        jugadorDiv.className = 'jugador-campos';
        jugadorDiv.innerHTML = `<h4>Campos de ${nombre} (Oro: ${jugadoresData[nombre].oro})</h4>`;

        const camposDelJugador = jugadoresData[nombre].campos;
        
        Object.keys(camposDelJugador).forEach(campoKey => {
            const campo = camposDelJugador[campoKey];
            const campoDiv = document.createElement('div');
            campoDiv.className = 'campo';
            
            if (campo.length > 0) {
                campo.forEach(carta => {
                    const cartaDiv = document.createElement('div');
                    cartaDiv.textContent = carta.nombre;
                    cartaDiv.className = `carta ${carta.nombre.toLowerCase().replace(/\s/g, '-')}`;
                    campoDiv.appendChild(cartaDiv);
                });
            } else {
                campoDiv.textContent = 'Campo vacío';
                campoDiv.style.color = '#aaa';
                campoDiv.style.fontSize = '12px';
            }
            jugadorDiv.appendChild(campoDiv);
        });
        todosCamposContainer.appendChild(jugadorDiv);
    });
}

// ... (El resto de las funciones como cosecharCampo, plantarCarta, avanzarFase y pasarTurno no han cambiado, por lo que no las repito aquí para ahorrar espacio, pero asumo que las pegarás por completo) ...

// ** IMPORTANTE: Se añade la lógica de ofertas a onSnapshot **
function iniciarListenerPartida() {
    onSnapshot(doc(db, 'partidas', codigoPartida), snapshot => {
        if (snapshot.exists()) {
            const partidaData = snapshot.data();
            
            mazo = partidaData.mazo || [];
            turnoActual = partidaData.turnoActual;
            faseActual = partidaData.faseActual; 
            cartasDeComercio = partidaData.cartasDeComercio || []; 
            jugadoresEnPartida = Object.keys(partidaData.jugadores); // Actualizar la lista de jugadores

            mensajeTurno.textContent = `Turno de: ${turnoActual}`;
            faseInfo.textContent = `Fase actual: ${faseActual}`; 
            mazoInfo.textContent = `Cartas en el mazo: ${mazo.length}`; 
            
            if (nombreJugador === turnoActual) {
                pasarTurnoBtn.style.display = 'block';
            } else {
                pasarTurnoBtn.style.display = 'none';
            }

            const miData = partidaData.jugadores[nombreJugador];
            if (miData) {
                mano = miData.mano;
                campos = miData.campos; 
                oro = miData.oro;
                oroInfo.textContent = `Oro: ${oro}`;
                renderMano();
                renderCampos();
            }
            
            renderizarTodosLosCampos(partidaData.jugadores);
            renderCartasDeComercio();
            
            // Lógica para mostrar las ofertas recibidas
            ofertasRecibidasContainer.innerHTML = '';
            const miPropuesta = partidaData.propuestas?.[nombreJugador];
            if (miPropuesta) {
                const ofertaDiv = document.createElement('div');
                ofertaDiv.innerHTML = `
                    <p>Has recibido una oferta de ${turnoActual}: ${miPropuesta.nombre}</p>
                    <button id="aceptarOfertaBtn">Aceptar</button>
                `;
                ofertasRecibidasContainer.appendChild(ofertaDiv);
                document.getElementById('aceptarOfertaBtn').addEventListener('click', () => {
                    aceptarOferta(miPropuesta);
                });
            }

            listaJugadores.innerHTML = '';
            jugadoresEnPartida.forEach(jug => {
                const li = document.createElement('li');
                li.textContent = jug;
                listaJugadores.appendChild(li);
            });
        }
    });
}


// --- Event Listeners y Lógica Inicial ---

crearBtn.addEventListener('click', async () => {
    // ... (el código de esta función es igual al anterior, solo cambia la parte de 'propuestas' para inicializarlo) ...
    try {
        await setDoc(doc(db, 'partidas', codigoPartida), {
            jugadores: {
                [nombreJugador]: { mano: manoInicial, campos: camposIniciales, oro: 0 }
            },
            mazo: mazoActualizado,
            turnoActual: nombreJugador,
            faseActual: 1, 
            cartasDeComercio: [],
            propuestas: {} // Nuevo: Inicializar un objeto para las propuestas
        });
        
        // ... (resto del código)
    } catch (error) {
        // ... (código de error)
    }
});

async function unirseAPartida(codigo) {
    // ... (el código de esta función es igual al anterior) ...
}

unirseBtn.addEventListener('click', () => {
    const codigo = codigoInput.value.trim();
    if (!codigo) {
        alert('Introduce el código de la partida.');
        return;
    }
    unirseAPartida(codigo);
});

pasarTurnoBtn.addEventListener('click', avanzarFase);

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