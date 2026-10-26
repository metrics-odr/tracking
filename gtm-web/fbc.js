// Variável GTM (Custom JavaScript): "JS - fbc"
// Retorna o cookie _fbc; se ausente e a URL tiver ?fbclid=, cria no formato
// fb.1.<timestamp_ms>.<fbclid> (preserva o case do fbclid).
function () {
  function getCookie(n) {
    var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }
  var fbc = getCookie('_fbc');
  if (fbc) return fbc;

  var m = location.search.match(/[?&]fbclid=([^&#]+)/);
  if (!m) return undefined;

  fbc = 'fb.1.' + Date.now() + '.' + decodeURIComponent(m[1]);
  var domain = '.seudominio.com.br'; // AJUSTE: domínio raiz do site
  document.cookie = '_fbc=' + encodeURIComponent(fbc) +
    ';domain=' + domain + ';path=/;max-age=7776000;SameSite=Lax;Secure';
  return fbc;
}
