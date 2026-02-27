import { modeloReserva } from "../models/modeloReserva.js";

export class ServicioReserva {
  constructor() {}
  async registrar(datosReserva) {
    let reservaNueva = new modeloReserva(datosReserva);
    return await reservaNueva.save();
  }
  async buscarTodas() {
    let reservas = await modeloReserva.find();
    return reservas;
  }
  async buscarPorId(idReserva) {
    let reserva = await modeloReserva.findById(idReserva);
    return reserva;
  }
  async editar(idReserva, datosReserva) {
    return await modeloReserva.findByIdAndUpdate(idReserva, datosReserva);
  }
  async eliminar(idReserva) {
    let eliminarReserva = await modeloReserva.findByIdAndDelete(idReserva)
    return eliminarReserva
  }
}
