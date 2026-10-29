// Pegar el portapapeles en el cuadro de texto actual con una tecla o con el botón central del mouse.
// La tecla, el botón y si hay que pulsar 2 veces se eligen en la configuración (opciones.html);
// los valores predeterminados están en configuracion.js.
// Se carga al inicio de la página (document_start) para escuchar antes que ella: así la página
// no puede bloquear el pegado
const TIEMPO_DOBLE_PULSACION = 500; // ms máximos entre las 2 pulsaciones
const ESPERA_PEGADO_BLOQUEADO = 50; // ms que se le dan a la página para pegar antes de revisar si lo bloqueó
const ESPERA_PEGADO_EDITOR = 200; // los editores de texto enriquecido pueden tardar más en pegar a su manera
const CODIGOS_MODIFICADORES = ['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'];

let configPegado = { ...CONFIG_PREDETERMINADA };
let teclaPresionada = false;
let pulsacionLimpia = false;
let bloquearTecla = false;
let ultimaPulsacion = 0;
let leyendoPortapapeles = false;
let textoLeido = '';

function cargarConfigPegado() {
    chrome.storage.sync.get(CONFIG_PREDETERMINADA, guardada => { configPegado = guardada; });
}
cargarConfigPegado();
// Aplicar los cambios de la configuración sin recargar la página
chrome.storage.onChanged.addListener((cambios, area) => {
    if (area === 'sync') cargarConfigPegado();
});

// Los listeners van en window, en fase de captura, para escuchar antes que la página. Algunas páginas
// reescriben su documento con document.open/write (ej. los paneles de Apps Script en Google Sheets) y
// eso borra los listeners: al ver el documento nuevo se vuelven a poner (agregarlos otra vez no los duplica)
function escucharEventos() {
    window.addEventListener('keydown', alPresionarTecla, true);
    window.addEventListener('keyup', alSoltarTecla, true);
    window.addEventListener('mousedown', alPresionarRueda, true);
    window.addEventListener('paste', alPegar, true);
    window.addEventListener('keydown', alPresionarCtrlV, true);
}
escucharEventos();
new MutationObserver(escucharEventos).observe(document, { childList: true });

// --- Disparador: tecla ---
// Cuenta como pulsación presionar y soltar la tecla sola, para no estorbar
// combinaciones como AltGr+Q (@) del teclado en español
function alPresionarTecla(event) {
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
}

function alSoltarTecla(event) {
    if (configPegado.disparador !== 'tecla' || event.code !== configPegado.codigoTecla) return;

    const fuePulsacionSola = teclaPresionada && pulsacionLimpia;
    teclaPresionada = false;
    pulsacionLimpia = false;
    bloquearTecla = false;

    if (fuePulsacionSola && registrarPulsacion()) {
        event.preventDefault();
        pegarEn(obtenerCampoActual());
    }
}

// Windows envía un Ctrl izquierdo junto con AltGr; no cuenta como otra tecla
function esControlDeAltGr(event) {
    return configPegado.codigoTecla === 'AltRight' && event.code === 'ControlLeft';
}

// --- Disparador: botón central del mouse (rueda) ---
// Pega en el cuadro de texto donde se hace clic con la rueda
function alPresionarRueda(event) {
    if (configPegado.disparador !== 'mouse' || event.button !== 1) return;

    const campo = campoBajoElCursor(event);
    if (!campo) return;

    event.preventDefault(); // Evita que la rueda active el desplazamiento automático
    campo.focus();
    if (registrarPulsacion()) pegarEn(campo);
}

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

// --- Desbloqueo de Ctrl+V (y de "Pegar" en el menú del clic derecho) ---
// Siempre activo y en cualquier cuadro de texto: simple, editor, dentro de iframes o de Shadow DOM.
// Primero se deja que la página pegue a su manera (por ejemplo, repartir un código en varios
// cuadros); solo si lo bloqueó, se escribe el texto como si se tecleara
function alPegar(event) {
    if (leyendoPortapapeles) {
        // Pegado propio (leerPortapapeles): se toma el texto y la página no llega a ver el evento
        textoLeido = event.clipboardData.getData('text/plain');
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
    }

    const campo = obtenerCampoActual();
    if (!event.isTrusted || !esCampoForzable(campo)) return;

    // La página canceló el pegado o lo deshizo: el cuadro quedó igual que antes
    const texto = event.clipboardData.getData('text/plain');
    const antes = estadoDelCuadro(campo);
    setTimeout(() => {
        if (estadoDelCuadro(campo) === antes && obtenerCampoActual() === campo) escribirTexto(campo, texto);
    }, esperaDePegado(campo));
}

function alPresionarCtrlV(event) {
    if (!event.isTrusted || !esAtajoDePegar(event)) return;
    const campo = obtenerCampoActual();
    if (!esCampoForzable(campo)) return;

    // La página canceló Ctrl+V, así que el navegador ni siquiera intentó pegar
    // (si el cuadro cambió, la página pegó por su cuenta)
    const antes = estadoDelCuadro(campo);
    setTimeout(() => {
        if (event.defaultPrevented && estadoDelCuadro(campo) === antes && obtenerCampoActual() === campo) pegarEn(campo);
    }, esperaDePegado(campo));
}

// Ctrl+V, Ctrl+Shift+V, Cmd+V o Shift+Insert
function esAtajoDePegar(event) {
    const tecla = (event.key || '').toLowerCase();
    if (event.altKey) return false; // AltGr+V es otra combinación
    return ((event.ctrlKey || event.metaKey) && tecla === 'v') ||
        (event.shiftKey && !event.ctrlKey && tecla === 'insert');
}

// Cualquier cuadro de texto editable y visible. Los editores de código, Google Docs y Sheets usan
// un cuadro invisible (o un recuadro diminuto) y pegan a su manera, así que en ellos no se
// interviene: ahí funciona el atajo
function esCampoForzable(campo) {
    if (!esCampoDeTexto(campo) || campo.readOnly || campo.disabled) return false;
    if (window.innerWidth < 10 || window.innerHeight < 10) return false;

    const caja = campo.getBoundingClientRect();
    const estilo = getComputedStyle(campo);
    return caja.width >= 10 && caja.height >= 10 && estilo.opacity !== '0' && estilo.color !== 'rgba(0, 0, 0, 0)';
}

function esperaDePegado(campo) {
    return campo.isContentEditable ? ESPERA_PEGADO_EDITOR : ESPERA_PEGADO_BLOQUEADO;
}

// Texto y posición del cursor, para saber si el pegado cambió algo
function estadoDelCuadro(campo) {
    if (campo.isContentEditable) return campo.innerHTML;
    try {
        return `${campo.selectionStart},${campo.selectionEnd}|${campo.value}`;
    } catch (err) {
        return campo.value; // Los cuadros email y number no dejan leer el cursor
    }
}

function obtenerCampoActual() {
    let campo = document.activeElement;
    // Si el foco está dentro de un componente con Shadow DOM (abierto o cerrado), bajar hasta el campo real
    let raiz;
    while (campo && (raiz = raizDeSombra(campo)) && raiz.activeElement) {
        campo = raiz.activeElement;
    }
    return esCampoDeTexto(campo) ? campo : null;
}

function campoBajoElCursor(event) {
    let elemento = event.composedPath()[0];
    // En un Shadow DOM cerrado la ruta del evento se detiene en el componente: bajar hasta el campo bajo el cursor
    let raiz;
    while (elemento && !esCampoDeTexto(elemento) && (raiz = raizDeSombra(elemento))) {
        const interior = raiz.elementFromPoint(event.clientX, event.clientY);
        if (!interior || interior === elemento) break;
        elemento = interior;
    }
    if (!esCampoDeTexto(elemento)) return null;
    // En un editor (contenteditable) enfocar el contenedor editable, no el texto interno
    while (elemento.isContentEditable && elemento.parentElement && elemento.parentElement.isContentEditable) {
        elemento = elemento.parentElement;
    }
    return elemento;
}

// chrome.dom permite a la extensión ver también los Shadow DOM cerrados. En una pestaña que quedó
// abierta al recargar la extensión, chrome.dom ya no existe: ahí solo se ven los abiertos
function raizDeSombra(elemento) {
    return chrome.dom ? chrome.dom.openOrClosedShadowRoot(elemento) : elemento.shadowRoot;
}

function pegarEn(campo) {
    if (!campo) return;
    const texto = leerPortapapeles();
    if (texto) {
        pegarTexto(campo, texto);
    } else if (chrome.runtime && chrome.runtime.id) {
        // Algunos cuadros invisibles no dejan leer el portapapeles desde ellos (ej. Google Docs):
        // se lee en un documento oculto de la extensión (portapapeles.html)
        chrome.runtime.sendMessage({ tipo: 'leer-portapapeles' }, textoAparte => {
            if (textoAparte && obtenerCampoActual() === campo) pegarTexto(campo, textoAparte);
        });
    }
}

// Lee el texto con un pegado propio que la página no ve (requiere el permiso clipboardRead)
function leerPortapapeles() {
    leyendoPortapapeles = true;
    textoLeido = '';
    try {
        document.execCommand('paste');
    } finally {
        leyendoPortapapeles = false;
    }
    return textoLeido;
}

// Igual que Ctrl+V: la página recibe un pegado con el texto y lo maneja a su manera (Google Docs
// y Sheets lo ponen en el documento o la celda). Si nadie lo atiende o la página lo bloquea,
// se escribe el texto como si se tecleara
function pegarTexto(campo, texto) {
    const datos = new DataTransfer();
    datos.setData('text/plain', texto);
    const antes = estadoDelCuadro(campo);
    const atendido = !campo.dispatchEvent(new ClipboardEvent('paste', {
        clipboardData: datos, bubbles: true, cancelable: true, composed: true
    }));

    setTimeout(() => {
        if (estadoDelCuadro(campo) !== antes || obtenerCampoActual() !== campo) return; // la página ya lo pegó
        if (atendido && !esCampoForzable(campo)) return; // cuadro invisible: la página lo pegó a su manera
        escribirTexto(campo, texto);
    }, esperaDePegado(campo));
}

// Escribe el texto como si se tecleara: la página recibe el evento input de siempre
// (React, Angular, etc. lo registran) y no lo distingue de un pegado para bloquearlo
function escribirTexto(campo, texto) {
    // Algunos cuadros invisibles (ej. Google Docs) no aceptan texto escrito así; ahí la página ya pegó
    if (!texto || !document.queryCommandEnabled('insertText')) return;
    if (!document.execCommand('insertText', false, texto)) {
        console.error("No se pudo pegar el portapapeles");
    }
}

function esCampoDeTexto(elemento) {
    if (!elemento || elemento.nodeType !== Node.ELEMENT_NODE) return false;
    if (elemento.isContentEditable || elemento.tagName === 'TEXTAREA') return true;

    const tiposDeTexto = ['text', 'search', 'url', 'tel', 'email', 'password', 'number'];
    return elemento.tagName === 'INPUT' && tiposDeTexto.includes(elemento.type);
}
