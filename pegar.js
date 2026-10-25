// Pegar el portapapeles en el cuadro de texto actual con una tecla o con el botón central del mouse.
// La tecla, el botón y si hay que pulsar 2 veces se eligen en la configuración (opciones.html);
// los valores predeterminados están en configuracion.js
const TIEMPO_DOBLE_PULSACION = 500; // ms máximos entre las 2 pulsaciones
const CODIGOS_MODIFICADORES = ['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'];

let configPegado = { ...CONFIG_PREDETERMINADA };
let teclaPresionada = false;
let pulsacionLimpia = false;
let bloquearTecla = false;
let ultimaPulsacion = 0;

function cargarConfigPegado() {
    chrome.storage.sync.get(CONFIG_PREDETERMINADA, guardada => { configPegado = guardada; });
}
cargarConfigPegado();
// Aplicar los cambios de la configuración sin recargar la página
chrome.storage.onChanged.addListener((cambios, area) => {
    if (area === 'sync') cargarConfigPegado();
});

// --- Disparador: tecla ---
// Cuenta como pulsación presionar y soltar la tecla sola, para no estorbar
// combinaciones como AltGr+Q (@) del teclado en español
window.addEventListener('keydown', function(event) {
    if (configPegado.disparador !== 'tecla') return;

    if (event.code === configPegado.codigoTecla) {
        if (!event.repeat) {
            const esModificador = CODIGOS_MODIFICADORES.includes(event.code);
            teclaPresionada = true;
            // Una tecla normal con Ctrl/Alt/Win presionado es otra combinación (ej. Ctrl+F2)
            pulsacionLimpia = esModificador || !(event.ctrlKey || event.altKey || event.metaKey);
            // Que una tecla normal (ej. F2) no escriba ni haga su acción dentro del cuadro de texto
            bloquearTecla = !esModificador && pulsacionLimpia && obtenerCampoActual() !== null;
        }
        if (bloquearTecla) event.preventDefault();
    } else if (!esControlDeAltGr(event)) {
        // Otra tecla: ya no es una pulsación sola ni cuenta como segunda pulsación rápida
        pulsacionLimpia = false;
        ultimaPulsacion = 0;
    }
}, true); // true = Fase de captura

window.addEventListener('keyup', function(event) {
    if (configPegado.disparador !== 'tecla' || event.code !== configPegado.codigoTecla) return;

    const fuePulsacionSola = teclaPresionada && pulsacionLimpia;
    teclaPresionada = false;
    pulsacionLimpia = false;
    bloquearTecla = false;

    if (fuePulsacionSola && registrarPulsacion()) {
        event.preventDefault();
        pegarEn(obtenerCampoActual());
    }
}, true);

// Windows envía un Ctrl izquierdo junto con AltGr; no cuenta como otra tecla
function esControlDeAltGr(event) {
    return configPegado.codigoTecla === 'AltRight' && event.code === 'ControlLeft';
}

// --- Disparador: botón central del mouse (rueda) ---
// Pega en el cuadro de texto donde se hace clic con la rueda
window.addEventListener('mousedown', function(event) {
    if (configPegado.disparador !== 'mouse' || event.button !== 1) return;

    const campo = campoBajoElCursor(event);
    if (!campo) return;

    event.preventDefault(); // Evita que la rueda active el desplazamiento automático
    campo.focus();
    if (registrarPulsacion()) pegarEn(campo);
}, true);

// Devuelve true cuando ya se completaron las pulsaciones necesarias (1, o 2 rápidas)
function registrarPulsacion() {
    if (!configPegado.doblePulsacion) return true;

    const ahora = Date.now();
    if (ahora - ultimaPulsacion <= TIEMPO_DOBLE_PULSACION) {
        ultimaPulsacion = 0;
        return true;
    }
    ultimaPulsacion = ahora;
    return false;
}

function obtenerCampoActual() {
    let campo = document.activeElement;
    // Si el foco está dentro de un componente con Shadow DOM, bajar hasta el campo real
    while (campo && campo.shadowRoot && campo.shadowRoot.activeElement) {
        campo = campo.shadowRoot.activeElement;
    }
    return esCampoDeTexto(campo) ? campo : null;
}

function campoBajoElCursor(event) {
    let elemento = event.composedPath()[0];
    if (!esCampoDeTexto(elemento)) return null;
    // En un editor (contenteditable) enfocar el contenedor editable, no el texto interno
    while (elemento.isContentEditable && elemento.parentElement && elemento.parentElement.isContentEditable) {
        elemento = elemento.parentElement;
    }
    return elemento;
}

function pegarEn(campo) {
    if (!campo) return;
    // Igual que Ctrl+V: la página recibe el pegado normal (requiere el permiso clipboardRead)
    if (!document.execCommand('paste')) {
        console.error("No se pudo pegar el portapapeles");
    }
}

function esCampoDeTexto(elemento) {
    if (!elemento || elemento.nodeType !== Node.ELEMENT_NODE) return false;
    if (elemento.isContentEditable || elemento.tagName === 'TEXTAREA') return true;

    const tiposDeTexto = ['text', 'search', 'url', 'tel', 'email', 'password', 'number'];
    return elemento.tagName === 'INPUT' && tiposDeTexto.includes(elemento.type);
}
