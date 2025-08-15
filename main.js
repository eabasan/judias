import { crearMazo, repartirCartas } from './mazo.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
let nombreJugador, codigoPartida, mano = [], campos = [[],[],[]], mazo = [];

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

// Guardar nombre
guardarNombreBtn.addEventListener('click', () => {
    const nombre = nombreInput.value.trim();
    if(!nombre) return alert("Introduce tu nombre");
    nombreJugador = nombre;
    alert("Nombre guardado: " + nombreJugador);
    opcionesDiv.style.display = 'block';
});

// Generar código
function generarCodigo() {
    return Math.random().toString(36).substr(2,5).toUpperCase();
}

// Render mano
function renderMano() {
    manoContainer.innerHTML = '';
    mano.forEach((carta, i) => {
        const div = document.createElement('div');
        div.className = `carta ${carta.nombre.toLowerCase()}`;
        div.textContent = carta.nombre;
        div.addEventListener('click', () => plantarCarta(i));
        manoContainer.appendChild(div);
    });
}

// Render campos
function renderCampos() {
    camposContainer.innerHTML = '';
    campos.forEach((campo,i) => {
        const div = document.createElement('div');
        div.className = 'campo';
        campo.forEach(c => {
            const cartaDiv = document.createElement('div');
            cartaDiv.textContent = c.nombre;
            cartaDiv.className = `carta ${c.nombre.toLowerCase()}`;
            div.appendChild(cartaDiv);
        });
        camposContainer.appendChild(div);
    });
}

// Plantar carta
function plantarCarta(i) {
    const carta = mano[i];
    let planted = false;
    for(let j=0;j<3;j++){
        if(campos[j].length === 0 || campos[j][0].nombre === carta.nombre){
            campos[j].push(carta);
            planted = true;
            break;
        }
    }
    if(planted){
        mano.splice(i,1);
        renderMano();
        renderCampos();
    } else {
        alert('No puedes plantar esta judía en ningún campo.');
    }
}

// Crear partida
crearBtn.addEventListener('click', async () => {
    codigoPartida = generarCodigo();
    mazo = crearMazo();
    mano = repartirCartas(mazo,5);
    campos = [[],[],[]];
    renderMano();
    renderCampos();
    codigoContainer.textContent = `Código de partida: ${codigoPartida}`;

    await setDoc(doc(db,'partidas',codigoPartida), {
        jugadores: [{ nombre: nombreJugador, mano, campos }],
        mazo
    });

    // Escuchar la partida en tiempo real
    onSnapshot(doc(db,'partidas',codigoPartida), snapshot => {
        if(snapshot.exists()){
            const data = snapshot.data();
            listaJugadores.innerHTML = '';
            data.jugadores.forEach(j => {
                const li = document.createElement('li');
                li.textContent = j.nombre;
                listaJugadores.appendChild(li);
            });
        }
    });
});

// Unirse a partida
unirseBtn.addEventListener('click', async () => {
    const codigo = codigoInput.value.trim();
    if(!codigo) return alert('Introduce el código de la partida');
    codigoPartida = codigo;

    const partidaRef = doc(db,'partidas',codigo);
    await updateDoc(partidaRef, {
        jugadores: arrayUnion({ nombre: nombreJugador, mano, campos })
    });

    // Escuchar cambios en tiempo real
    onSnapshot(partidaRef, snapshot => {
        if(snapshot.exists()){
            const data = snapshot.data();
            listaJugadores.innerHTML = '';
            data.jugadores.forEach(j => {
                const li = document.createElement('li');
                li.textContent = j.nombre;
                listaJugadores.appendChild(li);
            });
        }
    });
});
