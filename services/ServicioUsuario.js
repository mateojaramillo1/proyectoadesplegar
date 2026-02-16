import { modeloUsuario } from "../models/modeloUsuario.js";

export class ServicioUsuario {
  constructor() {}

  async registrar(datosUsuario) {
    let usuario = new modeloUsuario(datosUsuario);
    return await usuario.save();
  }

  async buscarPorId(id) {
    return await modeloUsuario.findById(id).select('-password');
  }

  async buscarPorEmail(email) {
    return await modeloUsuario.findOne({ email: email });
  }
}
