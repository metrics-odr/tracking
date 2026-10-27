// Variável GTM (Custom JavaScript): "JS - external_id"
// Prioridade: ID do usuário logado (dataLayer user_data.external_id) > cookie ext_id estável.
// O MESMO valor deve ser usado em Pixel, GA4 (user_id) e CAPI.
function () {
  var dl = window.dataLayer || [];
  for (var i = dl.length - 1; i >= 0; i--) {
    var u = dl[i] && dl[i].user_data;
    if (u && u.external_id) return String(u.external_id);
  }
  function getCookie(n) {
    var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }
  var id = getCookie('ext_id');
  if (!id) {
    id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : Date.now() + '_' + Math.random().toString(36).slice(2, 12);
    document.cookie = 'ext_id=' + encodeURIComponent(id) +
      ';path=/;max-age=63072000;SameSite=Lax;Secure';
  }
  return id;
}
