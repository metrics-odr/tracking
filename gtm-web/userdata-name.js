// Variáveis GTM Web (JavaScript personalizado): "UserData - First Name" e "UserData - Last Name"
// Crie DUAS variáveis com este mesmo código, mudando só a constante PART.
//   PART = 'first'  -> "UserData - First Name"  (fn)
//   PART = 'last'   -> "UserData - Last Name"   (ln)
// Aceita campos separados (nome / sobrenome) ou um único campo "Nome completo".
// Retorna minúsculas; o servidor normaliza de novo e faz o hash.
function () {
  var PART = 'first';                   // 'first' | 'last'
  var KEY = '_ud_' + PART;
  var form = {{Form Element}};
  var found;

  function clean(s) { return String(s || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '').toLowerCase(); }
  function hintOf(f) { return ((f.name || '') + ' ' + (f.id || '') + ' ' + (f.autocomplete || '') + ' ' + (f.placeholder || '')).toLowerCase(); }

  if (form && form.querySelectorAll) {
    var fields = form.querySelectorAll('input[type=text], input:not([type]), input[type=search]');
    var first, last, full;
    for (var i = 0; i < fields.length; i++) {
      var h = hintOf(fields[i]), v = clean(fields[i].value);
      if (!v) continue;
      if (/sobrenome|last|family|surname/.test(h)) last = last || v;
      else if (/first|given|primeiro|^nome$|\bnome\b(?!.*(completo|full))/.test(h) && !/full|completo/.test(h)) first = first || v;
      else if (/full|completo|name|nome/.test(h)) full = full || v;
    }
    if (full && (!first || !last)) {
      var parts = full.split(' ');
      first = first || parts[0];
      last = last || (parts.length > 1 ? parts.slice(1).join(' ') : undefined);
    }
    found = PART === 'first' ? first : last;
  }

  try {
    if (found) { sessionStorage.setItem(KEY, found); return found; }
    return sessionStorage.getItem(KEY) || undefined;
  } catch (e) { return found; }
}
