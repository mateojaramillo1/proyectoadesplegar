import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ServicioUsuario } from '../services/ServicioUsuario.js';

const JWT_SECRET = process.env.SECRETO_JWT || 'secretkey';

export class ControladorAuth {
  constructor() {}

  async registrarUsuario(peticion, respuesta) {
    try {
      const servicio = new ServicioUsuario();
      const { nombre, apellido, email, telefono, password } = peticion.body;

      if (!nombre || !apellido || !email || !password) {
        return respuesta.status(400).json({ mensaje: 'Faltan datos requeridos' });
      }

      const existente = await servicio.buscarPorEmail(email);
      if (existente) {
        return respuesta.status(400).json({ mensaje: 'El email ya está registrado' });
      }

      const hash = await bcrypt.hash(password, 10);
      const nuevo = await servicio.registrar({ nombre, apellido, email, telefono, password: hash, rol: 'user' });
      return respuesta.status(201).json({ mensaje: 'Usuario creado', usuarioId: nuevo.id });
    } catch (error) {
      return respuesta.status(500).json({ mensaje: 'Error registrando usuario: ' + error.message });
    }
  }

  async registrarAdmin(peticion, respuesta) {
    try {
      // peticion.usuario viene del middleware y debe ser admin
      if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
        return respuesta.status(403).json({ mensaje: 'Acceso denegado' });
      }

      const servicio = new ServicioUsuario();
      const { nombre, apellido, email, telefono, password } = peticion.body;

      if (!nombre || !apellido || !email || !password) {
        return respuesta.status(400).json({ mensaje: 'Faltan datos requeridos' });
      }

      const existente = await servicio.buscarPorEmail(email);
      if (existente) {
        return respuesta.status(400).json({ mensaje: 'El email ya está registrado' });
      }

      const hash = await bcrypt.hash(password, 10);
      const nuevo = await servicio.registrar({ nombre, apellido, email, telefono, password: hash, rol: 'admin' });
      return respuesta.status(201).json({ mensaje: 'Administrador creado', usuarioId: nuevo.id });
    } catch (error) {
      return respuesta.status(500).json({ mensaje: 'Error creando admin: ' + error.message });
    }
  }

  async login(peticion, respuesta) {
    try {
      const { email, password } = peticion.body;
      if (!email || !password) return respuesta.status(400).json({ mensaje: 'Faltan credenciales' });

      const servicio = new ServicioUsuario();
      const usuario = await servicio.buscarPorEmail(email);
      if (!usuario) return respuesta.status(400).json({ mensaje: 'Credenciales inválidas' });

      const match = await bcrypt.compare(password, usuario.password);
      if (!match) return respuesta.status(400).json({ mensaje: 'Credenciales inválidas' });

      const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '12h' });
      return respuesta.status(200).json({ mensaje: 'Login correcto', token, usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, rol: usuario.rol } });
    } catch (error) {
      return respuesta.status(500).json({ mensaje: 'Error en login: ' + error.message });
    }
  }
}
