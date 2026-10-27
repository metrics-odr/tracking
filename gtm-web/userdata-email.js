// Variável GTM Web (JavaScript personalizado): "UserData - Email"
// Use com o acionador "Envio de formulário". Lê o e-mail do formulário enviado
// ({{Form Element}}, variável incorporada) e o guarda na sessão para os eventos seguintes.
// Só execute com consentimento (a tag que usa esta variável deve respeitar o Consent Mode).
function () {
  var KEY = '_ud_em';
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var form = {{Form Element}};
  var found;

  if (form && form.querySelectorAll) {
    var fields = form.querySelectorAll('input, textarea');
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var v = (f.value || '').replace(/^\s+|\s+$/g, '');
      var hint = ((f.type || '') + ' ' + (f.name || '') + ' ' + (f.id || '') + ' ' + (f.autocomplete || '')).toLowerCase();
      if ((f.type === 'email' || /e-?mail/.test(hint)) && re.test(v)) { found = v.toLowerCase(); break; }
    }
    if (!found) {                       // fallback: qualquer campo com formato de e-mail
      for (var j = 0; j < fields.length; j++) {
        var w = (fields[j].value || '').replace(/^\s+|\s+$/g, '');
        if (re.test(w)) { found = w.toLowerCase(); break; }
      }
    }
  }

  try {
    if (found) { sessionStorage.setItem(KEY, found); return found; }
    return sessionStorage.getItem(KEY) || undefined;
  } catch (e) { return found; }
}
