import jwt from 'jsonwebtoken';
import { ServicioUsuario } from '../services/ServicioUsuario.js';

const JWT_SECRET = process.env.SECRETO_JWT || 'secretkey';

export async function verificarToken(peticion, respuesta, siguiente) {
  try {
    const auth = peticion.headers['authorization'] || peticion.headers['Authorization'];
    if (!auth) return respuesta.status(401).json({ mensaje: 'No token proporcionado' });

    const partes = auth.split(' ');
    if (partes.length !== 2 || partes[0] !== 'Bearer') return respuesta.status(401).json({ mensaje: 'Formato de token inválido' });

    const token = partes[1];
    const decodificado = jwt.verify(token, JWT_SECRET);
    // adjuntar usuario básico
    const servicio = new ServicioUsuario();
    const usuario = await servicio.buscarPorId(decodificado.id);
    if (!usuario) return respuesta.status(401).json({ mensaje: 'Token inválido (usuario no existe)' });

    peticion.usuario = { id: usuario._id.toString(), rol: usuario.rol, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email };
    siguiente();
  } catch (error) {
    return respuesta.status(401).json({ mensaje: 'Token inválido: ' + error.message });
  }
}

export function verificarAdmin(peticion, respuesta, siguiente) {
  if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
    return respuesta.status(403).json({ mensaje: 'Se requiere rol de administrador' });
  }
  siguiente();
}
