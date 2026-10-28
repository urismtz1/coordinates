// Documento oculto de la extensión: pega el portapapeles en un cuadro y devuelve el texto
// (requiere el permiso clipboardRead)
chrome.runtime.onMessage.addListener((mensaje, remitente, responder) => {
    if (mensaje.tipo !== 'leer-portapapeles-oculto') return;

    const cuadro = document.getElementById('cuadro');
    cuadro.value = '';
    cuadro.focus();
    document.execCommand('paste');
    responder(cuadro.value);
});
