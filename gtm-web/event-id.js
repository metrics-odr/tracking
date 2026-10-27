// Variável GTM (Custom JavaScript): "JS - event_id"
// Usa o event_id do dataLayer; senão gera um e o memoriza por evento do GTM
// (nome do evento + posição no dataLayer), garantindo o MESMO valor em Pixel, GA4 e CAPI.
// Prefira sempre enviar event_id no próprio dataLayer.push do site.
function () {
  var dl = window.dataLayer || [];
  for (var i = dl.length - 1; i >= 0; i--) {
    if (dl[i] && dl[i].event === {{Event}} && dl[i].event_id) return String(dl[i].event_id);
  }
  window.__eidCache = window.__eidCache || {};
  var key = {{Event}} + ':' + dl.length;
  if (!window.__eidCache[key]) {
    window.__eidCache[key] = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now() + '_' + Math.random().toString(36).slice(2, 12);
  }
  return window.__eidCache[key];
}
