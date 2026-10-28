// Lee el portapapeles para el atajo de pegado cuando la página no deja leerlo desde el cuadro de texto
// (por ejemplo, el cuadro invisible de Google Docs). Se lee en un documento oculto de la extensión
// (portapapeles.html), que se crea la primera vez que hace falta
let creandoDocumento = null;

chrome.runtime.onMessage.addListener((mensaje, remitente, responder) => {
    if (mensaje.tipo !== 'leer-portapapeles') return;
    leerPortapapeles().then(responder, () => responder(''));
    return true; // La respuesta llega después
});

async function leerPortapapeles() {
    if (!(await chrome.offscreen.hasDocument())) {
        // Si llegan 2 pedidos seguidos, que no se intente crear el documento 2 veces
        creandoDocumento = creandoDocumento || chrome.offscreen.createDocument({
            url: 'portapapeles.html',
            reasons: ['CLIPBOARD'],
            justification: 'Leer el portapapeles para el atajo de pegado'
        });
        await creandoDocumento;
        creandoDocumento = null;
    }
    return chrome.runtime.sendMessage({ tipo: 'leer-portapapeles-oculto' });
}
