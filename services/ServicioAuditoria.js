import { modeloAuditoria } from '../models/modeloAuditoria.js';

function extraerIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '';
}

export class ServicioAuditoria {
  async registrar(req, payload) {
    try {
      const actor = req.usuario || {};
      await modeloAuditoria.create({
        evento: payload.evento,
        actorId: actor.id || undefined,
        actorEmail: actor.email || '',
        rol: actor.rol || 'anonimo',
        entidad: payload.entidad || '',
        entidadId: payload.entidadId || '',
        resultado: payload.resultado || 'ok',
        detalle: payload.detalle || '',
        ip: extraerIp(req),
        userAgent: String(req.headers['user-agent'] || '')
      });
    } catch (error) {
      // La auditoria no debe bloquear la operacion principal.
      console.error('No se pudo registrar auditoria:', error.message);
    }
  }
}
