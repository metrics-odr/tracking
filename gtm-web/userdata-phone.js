// Variável GTM Web (JavaScript personalizado): "UserData - Phone"
// Retorna só dígitos com DDI (Brasil: 55 + DDD + número), formato exigido pela Meta
// ("sem símbolos, letras e zeros à esquerda; com código do país"). O hash fica no servidor.
function () {
  var KEY = '_ud_ph';
  var DEFAULT_CC = '55';                // AJUSTE se o público principal não for o Brasil
  var form = {{Form Element}};
  var found;

  function norm(raw) {
    var d = String(raw || '').replace(/\D/g, '').replace(/^0+/, '');
    if (d.length < 10) return undefined;                       // curto demais p/ ser telefone
    if (d.length <= 11) d = DEFAULT_CC + d;                    // sem DDI -> adiciona
    return d.length >= 12 && d.length <= 15 ? d : undefined;
  }

  if (form && form.querySelectorAll) {
    var fields = form.querySelectorAll('input');
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var hint = ((f.type || '') + ' ' + (f.name || '') + ' ' + (f.id || '') + ' ' + (f.autocomplete || '')).toLowerCase();
      if (f.type === 'tel' || /tel|phone|fone|celular|whats|mobile/.test(hint)) {
        var n = norm(f.value);
        if (n) { found = n; break; }
      }
    }
  }

  try {
    if (found) { sessionStorage.setItem(KEY, found); return found; }
    return sessionStorage.getItem(KEY) || undefined;
  } catch (e) { return found; }
}
