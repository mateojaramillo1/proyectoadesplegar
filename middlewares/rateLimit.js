const store = new Map();

function limpiarEntradasExpiradas(windowMs) {
  const ahora = Date.now();
  for (const [clave, valor] of store.entries()) {
    if (ahora - valor.inicioVentana > windowMs) {
      store.delete(clave);
    }
  }
}

export function crearRateLimit({ windowMs = 15 * 60 * 1000, max = 100, message = 'Demasiadas solicitudes. Intente nuevamente.' } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    limpiarEntradasExpiradas(windowMs);

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ruta = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    const clave = `${ip}:${ruta}`;
    const ahora = Date.now();

    const entrada = store.get(clave);
    if (!entrada || ahora - entrada.inicioVentana > windowMs) {
      store.set(clave, { conteo: 1, inicioVentana: ahora });
      return next();
    }

    entrada.conteo += 1;
    store.set(clave, entrada);

    if (entrada.conteo > max) {
      const resetIn = Math.ceil((windowMs - (ahora - entrada.inicioVentana)) / 1000);
      res.setHeader('Retry-After', String(resetIn));
      return res.status(429).json({
        mensaje: message,
        retryAfterSeconds: resetIn
      });
    }

    return next();
  };
}
