// Pantalla de configuración del pegado (se abre desde el ícono de la extensión)
const NOMBRES_DE_TECLAS = {
    AltRight: 'AltGr',
    AltLeft: 'Alt izquierdo',
    ControlLeft: 'Ctrl izquierdo',
    ControlRight: 'Ctrl derecho',
    ShiftLeft: 'Shift izquierdo',
    ShiftRight: 'Shift derecho',
    MetaLeft: 'Windows',
    MetaRight: 'Windows derecho',
    Space: 'Espacio',
    ContextMenu: 'Menú'
};

const radiosDisparador = document.querySelectorAll('input[name="disparador"]');
const seccionTecla = document.getElementById('seccion-tecla');
const nombreTecla = document.getElementById('nombre-tecla');
const botonCambiar = document.getElementById('cambiar-tecla');
const casillaDoble = document.getElementById('doble-pulsacion');
const casillaDesbloquear = document.getElementById('desbloquear-pegado');
const textoAyuda = document.getElementById('ayuda');
const textoEstado = document.getElementById('estado');

let configActual = { ...CONFIG_PREDETERMINADA };
let capturando = false;
let temporizadorAltGr = null;
let temporizadorEstado = null;

chrome.storage.sync.get(CONFIG_PREDETERMINADA, guardada => {
    configActual = guardada;
    mostrarConfig();
});

function mostrarConfig() {
    const usaTecla = configActual.disparador === 'tecla';
    radiosDisparador.forEach(radio => { radio.checked = radio.value === configActual.disparador; });
    nombreTecla.textContent = configActual.nombreTecla;
    seccionTecla.classList.toggle('inactiva', !usaTecla);
    botonCambiar.disabled = !usaTecla;
    casillaDoble.checked = configActual.doblePulsacion;
    casillaDesbloquear.checked = configActual.desbloquearPegado;
    textoAyuda.textContent = usaTecla
        ? 'Pega en el cuadro de texto donde está el cursor. Evita letras, números, Enter o Tab: dejarían de escribirse en los cuadros de texto.'
        : 'Pega en el cuadro de texto donde haces clic con la rueda del mouse.';
}

function guardar(cambios) {
    Object.assign(configActual, cambios);
    mostrarConfig();
    chrome.storage.sync.set(cambios, () => {
        textoEstado.textContent = 'Guardado ✓';
        clearTimeout(temporizadorEstado);
        temporizadorEstado = setTimeout(() => { textoEstado.textContent = ''; }, 1500);
    });
}

radiosDisparador.forEach(radio => {
    radio.addEventListener('change', () => guardar({ disparador: radio.value }));
});
casillaDoble.addEventListener('change', () => guardar({ doblePulsacion: casillaDoble.checked }));
casillaDesbloquear.addEventListener('change', () => guardar({ desbloquearPegado: casillaDesbloquear.checked }));

// Elegir la tecla: la siguiente tecla que se presione pasa a ser la de pegado
botonCambiar.addEventListener('click', () => {
    capturando = true;
    botonCambiar.blur(); // Que Espacio o Enter no vuelvan a activar el botón
    nombreTecla.textContent = 'Presiona una tecla…';
    nombreTecla.classList.add('capturando');
    botonCambiar.textContent = 'Esc para cancelar';
});

window.addEventListener('keydown', event => {
    if (!capturando) return;
    event.preventDefault();

    clearTimeout(temporizadorAltGr);
    if (event.code === 'Escape') {
        terminarCaptura();
        mostrarConfig();
        return;
    }

    const codigo = event.code;
    const nombre = nombreDeTecla(event);
    if (codigo === 'ControlLeft') {
        // Windows envía Ctrl izquierdo justo antes de AltGr: esperar un instante por si llega AltGr
        temporizadorAltGr = setTimeout(() => asignarTecla(codigo, nombre), 100);
    } else {
        asignarTecla(codigo, nombre);
    }
});

function asignarTecla(codigo, nombre) {
    terminarCaptura();
    guardar({ codigoTecla: codigo, nombreTecla: nombre });
}

function terminarCaptura() {
    capturando = false;
    nombreTecla.classList.remove('capturando');
    botonCambiar.textContent = 'Cambiar tecla';
}

function nombreDeTecla(event) {
    if (NOMBRES_DE_TECLAS[event.code]) return NOMBRES_DE_TECLAS[event.code];
    if (event.key.length === 1) return event.key.toUpperCase();
    return event.key; // F2, Insert, Pause, ...
}
