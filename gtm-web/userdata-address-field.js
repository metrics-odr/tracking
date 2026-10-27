// Variáveis GTM Web (JavaScript personalizado) para os demais parâmetros de correspondência:
//   "UserData - City"    -> FIELD = 'city'
//   "UserData - State"   -> FIELD = 'state'
//   "UserData - Zip"     -> FIELD = 'zip'
//   "UserData - Country" -> FIELD = 'country'
//   "UserData - DOB"     -> FIELD = 'dob'
//   "UserData - Gender"  -> FIELD = 'gender'
// Crie uma variável por campo com este código, mudando só FIELD. Só preenche se o
// formulário realmente tiver o campo (não invente valores). O servidor normaliza e faz o hash.
function () {
  var FIELD = 'zip';                    // city | state | zip | country | dob | gender
  var DEFAULT_COUNTRY = 'br';           // usado só se FIELD === 'country' e o form não tiver o campo
  var KEY = '_ud_' + FIELD;
  var form = {{Form Element}};
  var found;

  var HINTS = {
    city: /city|cidade|municip/,
    state: /state|estado|region|uf\b/,
    zip: /zip|postal|cep/,
    country: /country|pais|país/,
    dob: /birth|nascimento|dob|aniversario|aniversário/,
    gender: /gender|genero|gênero|sexo/
  };

  if (form && form.querySelectorAll) {
    var fields = form.querySelectorAll('input, select');
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var h = ((f.name || '') + ' ' + (f.id || '') + ' ' + (f.autocomplete || '')).toLowerCase();
      var v = String(f.value || '').replace(/^\s+|\s+$/g, '');
      if (!v || !HINTS[FIELD].test(h)) continue;
      if ((f.type === 'radio' || f.type === 'checkbox') && !f.checked) continue;
      found = v;
      break;
    }
  }
  if (!found && FIELD === 'country') found = DEFAULT_COUNTRY;

  try {
    if (found) { sessionStorage.setItem(KEY, found); return found; }
    return sessionStorage.getItem(KEY) || undefined;
  } catch (e) { return found; }
}
