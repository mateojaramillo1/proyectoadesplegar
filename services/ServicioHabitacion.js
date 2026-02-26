
import { modeloHabitacion } from '../models/modeloHabitacion.js';

export class ServicioHabitacion {
  constructor() {}

  async registrar(datosHabitacion) {
    // Normalizar datos
    const { nombre, descripcion, precio, numeropersonas, foto } = datosHabitacion;
    const habitacion = new modeloHabitacion({
      nombre,
      descripcion,
      precio,
      numeropersonas,
      foto: Array.isArray(foto) ? foto : (foto ? [foto] : [])
    });
    const doc = await habitacion.save();
    return doc;
  }

  async buscarTodas() {
    const habitaciones = await modeloHabitacion.find();
    return habitaciones;
  }

  async buscarPorId(idHabitacion) {
    const hab = await modeloHabitacion.findById(idHabitacion);
    return hab;
  }

  async editar(idHabitacion, datosHabitacion) {
    const { nombre, descripcion, precio, numeropersonas, foto } = datosHabitacion;
    const update = {
      nombre,
      descripcion,
      precio,
      numeropersonas,
      foto: Array.isArray(foto) ? foto : (foto ? [foto] : [])
    };
    const hab = await modeloHabitacion.findByIdAndUpdate(idHabitacion, update, { new: true });
    return hab;
  }
}
