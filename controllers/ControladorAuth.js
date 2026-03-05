import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ServicioUsuario } from '../services/ServicioUsuario.js';
import { ServicioAuditoria } from '../services/ServicioAuditoria.js';
import { normalizarTexto, validarEmail, validarPasswordSegura } from '../utils/validaciones.js';

const JWT_SECRET = process.env.SECRETO_JWT || 'secretkey';

export class ControladorAuth {
  constructor() {}

  async registrarUsuario(peticion, respuesta) {
    try {
      const auditoria = new ServicioAuditoria();
      const servicio = new ServicioUsuario();
      const { nombre, apellido, email, telefono, password } = peticion.body;

      const payload = {
        nombre: normalizarTexto(nombre, 80),
        apellido: normalizarTexto(apellido, 80),
        email: String(email || '').trim().toLowerCase(),
        telefono: normalizarTexto(telefono, 30),
        password: String(password || '')
      };

      if (!payload.nombre || !payload.apellido || !payload.email || !payload.password) {
        return respuesta.status(400).json({ mensaje: 'Faltan datos requeridos' });
      }

      if (!validarEmail(payload.email)) {
        return respuesta.status(400).json({ mensaje: 'Formato de email invalido' });
      }

      if (!validarPasswordSegura(payload.password)) {
        return respuesta.status(400).json({ mensaje: 'La contrasena debe tener al menos 8 caracteres, letras y numeros' });
      }

      const existente = await servicio.buscarPorEmail(payload.email);
      if (existente) {
        return respuesta.status(400).json({ mensaje: 'El email ya está registrado' });
      }

      const hash = await bcrypt.hash(payload.password, 10);
      const nuevo = await servicio.registrar({
        nombre: payload.nombre,
        apellido: payload.apellido,
        email: payload.email,
        telefono: payload.telefono,
        password: hash,
        rol: 'user'
      });

      await auditoria.registrar(peticion, {
        evento: 'auth.register.user',
        entidad: 'usuario',
        entidadId: nuevo.id,
        detalle: `Registro exitoso para ${payload.email}`
      });

      return respuesta.status(201).json({ mensaje: 'Usuario creado', usuarioId: nuevo.id });
    } catch (error) {
      return respuesta.status(500).json({ mensaje: 'Error registrando usuario: ' + error.message });
    }
  }

  async registrarAdmin(peticion, respuesta) {
    try {
      const auditoria = new ServicioAuditoria();
      // peticion.usuario viene del middleware y debe ser admin
      if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
        return respuesta.status(403).json({ mensaje: 'Acceso denegado' });
      }

      const servicio = new ServicioUsuario();
      const { nombre, apellido, email, telefono, password } = peticion.body;

      const payload = {
        nombre: normalizarTexto(nombre, 80),
        apellido: normalizarTexto(apellido, 80),
        email: String(email || '').trim().toLowerCase(),
        telefono: normalizarTexto(telefono, 30),
        password: String(password || '')
      };

      if (!payload.nombre || !payload.apellido || !payload.email || !payload.password) {
        return respuesta.status(400).json({ mensaje: 'Faltan datos requeridos' });
      }

      if (!validarEmail(payload.email)) {
        return respuesta.status(400).json({ mensaje: 'Formato de email invalido' });
      }

      if (!validarPasswordSegura(payload.password)) {
        return respuesta.status(400).json({ mensaje: 'La contrasena debe tener al menos 8 caracteres, letras y numeros' });
      }

      const existente = await servicio.buscarPorEmail(payload.email);
      if (existente) {
        return respuesta.status(400).json({ mensaje: 'El email ya está registrado' });
      }

      const hash = await bcrypt.hash(payload.password, 10);
      const nuevo = await servicio.registrar({
        nombre: payload.nombre,
        apellido: payload.apellido,
        email: payload.email,
        telefono: payload.telefono,
        password: hash,
        rol: 'admin'
      });

      await auditoria.registrar(peticion, {
        evento: 'auth.register.admin',
        entidad: 'usuario',
        entidadId: nuevo.id,
        detalle: `Admin creado: ${payload.email}`
      });

      return respuesta.status(201).json({ mensaje: 'Administrador creado', usuarioId: nuevo.id });
    } catch (error) {
      return respuesta.status(500).json({ mensaje: 'Error creando admin: ' + error.message });
    }
  }

  async login(peticion, respuesta) {
    try {
      const auditoria = new ServicioAuditoria();
      const email = String(peticion.body?.email || '').trim().toLowerCase();
      const password = String(peticion.body?.password || '');
      if (!email || !password) return respuesta.status(400).json({ mensaje: 'Faltan credenciales' });

      if (!validarEmail(email)) {
        return respuesta.status(400).json({ mensaje: 'Formato de email invalido' });
      }

      const servicio = new ServicioUsuario();
      const usuario = await servicio.buscarPorEmail(email);
      if (!usuario) {
        await auditoria.registrar(peticion, {
          evento: 'auth.login.failed',
          entidad: 'usuario',
          resultado: 'error',
          detalle: `Usuario no encontrado para ${email}`
        });
        return respuesta.status(400).json({ mensaje: 'Credenciales inválidas' });
      }

      const match = await bcrypt.compare(password, usuario.password);
      if (!match) {
        await auditoria.registrar(peticion, {
          evento: 'auth.login.failed',
          entidad: 'usuario',
          entidadId: usuario.id,
          resultado: 'error',
          detalle: `Contrasena incorrecta para ${email}`
        });
        return respuesta.status(400).json({ mensaje: 'Credenciales inválidas' });
      }

      const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '12h' });
      await auditoria.registrar(peticion, {
        evento: 'auth.login.success',
        entidad: 'usuario',
        entidadId: usuario.id,
        detalle: `Inicio de sesion para ${email}`
      });
      return respuesta.status(200).json({ mensaje: 'Login correcto', token, usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, rol: usuario.rol } });
    } catch (error) {
      return respuesta.status(500).json({ mensaje: 'Error en login: ' + error.message });
    }
  }
}
