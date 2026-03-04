import { modeloUsuario } from '../models/modeloUsuario.js';

export class ServicioUsuario {
  constructor() {}

  normalizarUsuario(usuario) {
    if (!usuario) {
      return null;
    }

    const data = typeof usuario.toObject === 'function' ? usuario.toObject() : usuario;
    return {
      ...data,
      id: data._id?.toString() || data.id
    };
  }

  async registrar(datosUsuario) {
    const { nombre, apellido, email, telefono, password, rol } = datosUsuario;
    const usuarioCreado = await modeloUsuario.create({
      nombre,
      apellido,
      email,
      telefono: telefono || '',
      password,
      rol: rol || 'user'
    });

    return this.normalizarUsuario(usuarioCreado);
  }


  async buscarPorId(id) {
    const usuario = await modeloUsuario.findById(id);
    const normalizado = this.normalizarUsuario(usuario);
    if (!normalizado) {
      return null;
    }

    return {
      id: normalizado.id,
      nombre: normalizado.nombre,
      apellido: normalizado.apellido,
      email: normalizado.email,
      telefono: normalizado.telefono,
      rol: normalizado.rol
    };
  }


  async buscarPorEmail(email) {
    const usuario = await modeloUsuario.findOne({ email: String(email).toLowerCase().trim() });
    return this.normalizarUsuario(usuario);
  }

  async obtenerTodosLosAdmins() {
    const admins = await modeloUsuario.find({ rol: 'admin' });
    return admins.map(admin => this.normalizarUsuario(admin));
  }
}
