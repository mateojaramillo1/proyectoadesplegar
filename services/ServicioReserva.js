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

  // Buscar reservas de un usuario específico
  async buscarPorUsuario(idUsuario) {
    let reservas = await modeloReserva.find({ usuario: idUsuario }).sort({ fechainicio: -1 });
    return reservas;
  }

  // Verificar disponibilidad de habitación para fechas específicas
  // Solo considera reservas pendientes o aprobadas (no rechazadas)
  async verificarDisponibilidad(idHabitacion, fechaInicio, fechaFin, idReservaExcluir = null) {
    const query = {
      idHabitacion: idHabitacion,
      estado: { $in: ['pendiente', 'aprobada'] },
      // Buscar reservas que se solapen con las fechas solicitadas
      // Una reserva se solapa si:
      // - La fecha de inicio está dentro del rango existente, O
      // - La fecha de fin está dentro del rango existente, O
      // - Las fechas abarcan completamente una reserva existente
      $or: [
        // Caso 1: La nueva reserva empieza durante una existente
        { fechainicio: { $lt: new Date(fechaFin) }, fechafin: { $gt: new Date(fechaInicio) } }
      ]
    };

    // Si se está editando una reserva, excluirla de la búsqueda
    if (idReservaExcluir) {
      query._id = { $ne: idReservaExcluir };
    }

    const reservasConflicto = await modeloReserva.find(query);
    return {
      disponible: reservasConflicto.length === 0,
      reservasConflicto: reservasConflicto
    };
  }
}
