import mongoose from 'mongoose';

export function normalizarTexto(valor, maxLen = 120) {
  return String(valor || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLen);
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim().toLowerCase());
}

export function validarPasswordSegura(password) {
  const texto = String(password || '');
  const tieneLongitud = texto.length >= 8;
  const tieneLetra = /[A-Za-z]/.test(texto);
  const tieneNumero = /\d/.test(texto);
  return tieneLongitud && tieneLetra && tieneNumero;
}

export function validarObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ''));
}

export function validarRangoFechas(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    return { ok: false, mensaje: 'Las fechas deben tener formato valido YYYY-MM-DD' };
  }

  if (inicio >= fin) {
    return { ok: false, mensaje: 'La fecha de ingreso debe ser menor a la fecha de salida' };
  }

  return { ok: true };
}
