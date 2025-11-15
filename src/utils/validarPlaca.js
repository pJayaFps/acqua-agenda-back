// src/utils/validarPlaca.js
// Valida placas brasileiras: aceita formatos antigos (ABC-1234) e Mercosul (AAA1A23 / AAA1A23 sem hifen)
// Esta função tenta validar os formatos mais comuns.
function validarPlaca(placaRaw) {
  if (!placaRaw) return false;
  const placa = placaRaw.toUpperCase().replace(/\s/g, '');
  // Formato antigo: ABC-1234 ou ABC1234
  const regexAntigo = /^[A-Z]{3}-?\d{4}$/;
  // Formato Mercosul (ex.: ABC1D23) — simplificado para aceitar letra+digit mixture de 7 caracteres
  const regexMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;
  return regexAntigo.test(placa) || regexMercosul.test(placa);
}

module.exports = validarPlaca;
