// Define las cartas del juego (con nombres consistentes para CSS)
export function crearMazo() {
    return [
        { nombre: "Judia Bill" }, { nombre: "Judia Bill" }, { nombre: "Judia Bill" }, { nombre: "Judia Bill" }, { nombre: "Judia Bill" },
        { nombre: "Rocky Judia" }, { nombre: "Rocky Judia" }, { nombre: "Rocky Judia" }, { nombre: "Rocky Judia" },
        { nombre: "Judia Boom" }, { nombre: "Judia Boom" }, { nombre: "Judia Boom" },
        { nombre: "La Pocha" }, { nombre: "La Pocha" }, { nombre: "La Pocha" }, { nombre: "La Pocha" }, { nombre: "La Pocha" }, { nombre: "La Pocha" },
        { nombre: "Judia Colorá" }, { nombre: "Judia Colorá" }, { nombre: "Judia Colorá" }, { nombre: "Judia Colorá" },
        { nombre: "La Pestosa" }, { nombre: "La Pestosa" },
        { nombre: "El Judicultor" }, { nombre: "El Judicultor" },
        { nombre: "Hippy Judia" }
        // Añade más cartas y sus cantidades según las reglas de Bohnanza
        // Asegúrate de que los nombres coincidan con los de style.css para los colores
    ];
}

// Repartir cartas al azar y devolver el mazo actualizado
export function repartirCartas(mazoActual, cantidad) {
    const mano = [];
    const copiaMazo = [...mazoActual]; // Copia para no modificar el mazo original directamente
    for (let i = 0; i < cantidad; i++) {
        if (copiaMazo.length === 0) break;
        const index = Math.floor(Math.random() * copiaMazo.length);
        mano.push(copiaMazo.splice(index, 1)[0]);
    }
    return { mano, mazoActualizado: copiaMazo }; // Devolver la mano y el mazo restante
}

// Reconstruir carta desde nombre (mantengo por si la necesitas más adelante, aunque menos crítica ahora)
export function reconstruirCarta(nombre) {
    const todos = crearMazo(); // Crear un mazo completo cada vez que se llama (no ideal para rendimiento)
    return todos.find(c => c.nombre === nombre);
}