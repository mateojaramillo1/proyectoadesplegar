import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ServicioUsuario } from '../services/ServicioUsuario.js';
import { ServicioAuditoria } from '../services/ServicioAuditoria.js';
import { ServicioCorreo } from '../services/ServicioCorreo.js';
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

  async solicitarCambioContrasena(peticion, respuesta) {
    try {
      const auditoria = new ServicioAuditoria();
      const servicioUsuario = new ServicioUsuario();
      const servicioCorreo = new ServicioCorreo();
      
      const email = String(peticion.body?.email || '').trim().toLowerCase();

      if (!email || !validarEmail(email)) {
        return respuesta.status(400).json({ mensaje: 'Email inválido' });
      }

      const usuario = await servicioUsuario.buscarPorEmail(email);
      if (!usuario) {
        // Por seguridad, no indicamos si el email existe o no
        await auditoria.registrar(peticion, {
          evento: 'auth.cambio-contrasena.no-existe',
          entidad: 'usuario',
          detalle: `Intento de cambio de contraseña para email inexistente: ${email}`
        });
        return respuesta.status(200).json({ mensaje: 'Si el correo existe, recibirás un enlace para cambiar tu contraseña' });
      }

      // Generar token para cambio de contraseña (válido por 24 horas)
      const tokenCambio = jwt.sign(
        { id: usuario.id, email: usuario.email, type: 'password-reset' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Guardar el token en la base de datos (campo temporal)
      await servicioUsuario.actualizarTokenReinicio(usuario.id, tokenCambio);

      // Construir enlace de reinicio
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const enlaceReinicio = `${baseUrl}/cambiar-contrasena-token?token=${tokenCambio}`;

      // Enviar correo
      await servicioCorreo.enviarCorreoCambioContrasena(
        usuario.email,
        usuario.nombre,
        usuario.apellido,
        enlaceReinicio
      );

      await auditoria.registrar(peticion, {
        evento: 'auth.cambio-contrasena.solicitado',
        entidad: 'usuario',
        entidadId: usuario.id,
        detalle: `Solicitud de cambio de contraseña para ${email}`
      });

      return respuesta.status(200).json({ 
        mensaje: 'Si el correo existe, recibirás un enlace para cambiar tu contraseña' 
      });
    } catch (error) {
      console.error('Error solicitando cambio de contraseña:', error);
      return respuesta.status(500).json({ 
        mensaje: 'Error procesando solicitud: ' + error.message 
      });
    }
  }

  async confirmarCambioContrasena(peticion, respuesta) {
    try {
      const auditoria = new ServicioAuditoria();
      const servicioUsuario = new ServicioUsuario();
      const { token, nuevaContrasena } = peticion.body;

      if (!token || !nuevaContrasena) {
        return respuesta.status(400).json({ mensaje: 'Token y contraseña requeridos' });
      }

      // Validar la contraseña
      if (!validarPasswordSegura(nuevaContrasena)) {
        return respuesta.status(400).json({ 
          mensaje: 'La contraseña debe tener al menos 8 caracteres, letras y números' 
        });
      }

      // Verificar el token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'password-reset') {
          return respuesta.status(400).json({ mensaje: 'Token inválido' });
        }
      } catch (error) {
        return respuesta.status(400).json({ 
          mensaje: 'El enlace ha expirado o es inválido. Por favor solicita uno nuevo.' 
        });
      }

      // Obtener usuario
      const usuario = await servicioUsuario.buscarPorEmail(decoded.email);
      if (!usuario) {
        return respuesta.status(400).json({ mensaje: 'Usuario no encontrado' });
      }

      // Validar que el token en BD coincida
      if (usuario.tokenReinicio !== token) {
        return respuesta.status(400).json({ 
          mensaje: 'El enlace no es válido. Por favor solicita uno nuevo.' 
        });
      }

      // Hashear nueva contraseña
      const hash = await bcrypt.hash(nuevaContrasena, 10);

      // Actualizar contraseña y limpiar token
      await servicioUsuario.actualizar(usuario.id, {
        password: hash,
        tokenReinicio: null
      });

      await auditoria.registrar(peticion, {
        evento: 'auth.cambio-contrasena.completado',
        entidad: 'usuario',
        entidadId: usuario.id,
        detalle: `Contraseña cambiad exitosamente para ${usuario.email}`
      });

      return respuesta.status(200).json({ 
        mensaje: 'Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.' 
      });
    } catch (error) {
      console.error('Error confirmando cambio de contraseña:', error);
      return respuesta.status(500).json({ 
        mensaje: 'Error procesando cambio: ' + error.message 
      });
    }
  }
}
