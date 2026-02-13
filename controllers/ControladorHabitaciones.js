import { ServicioHabitacion } from "../services/ServicioHabitacion.js";
export class ControladorHabitaciones {
  constructor() {}

  
  async registrandoHabitacion(peticion, respuesta) {
    let objetoServicioHabitacion = new ServicioHabitacion();
    try {
      let datosHabitacion = peticion.body;

      const nombre = datosHabitacion?.nombre;
      const descripcion = datosHabitacion?.descripcion;
      const precio = Number(datosHabitacion?.precio);
      const numeropersonas = Number(datosHabitacion?.numeropersonas);
      const foto = Array.isArray(datosHabitacion?.foto)
        ? datosHabitacion.foto
        : typeof datosHabitacion?.foto === 'string' && datosHabitacion.foto.trim().length > 0
          ? [datosHabitacion.foto.trim()]
          : [];

      if (!nombre || !descripcion || foto.length === 0 || Number.isNaN(precio) || Number.isNaN(numeropersonas)) {
        return respuesta.status(400).json({
          mensaje: 'Revisa los datos enviados. Todos los campos son obligatorios.'
        });
      }

      if (numeropersonas < 1 || numeropersonas > 20) {
        return respuesta.status(400).json({
          mensaje: 'Revisa la cantidad de personas ingresadas.'
        });
      }

      if (precio <= 0) {
        return respuesta.status(400).json({
          mensaje: 'Revisa el precio por noche.'
        });
      }

      const datosNormalizados = {
        ...datosHabitacion,
        nombre,
        descripcion,
        precio,
        numeropersonas,
        foto
      };

      await objetoServicioHabitacion.registrar(datosNormalizados);
      return respuesta.status(201).json({
        mensaje: 'Habitación registrada correctamente.'
      });
      
    } catch (error) {
      return respuesta.status(500).json({
        mensaje: 'Fallamos en la operación: ' + error.message,
      });
    }
  }


  async buscandoHabitacion(peticion, respuesta) {
    let objetoServicioHabitacion = new ServicioHabitacion();
    try {
      let idHabitacion = peticion.params.idhabitacion;
      respuesta.status(200).json({
        mensaje: "exito buscando la habitacion",
        habitacion: await objetoServicioHabitacion.buscarPorId(idHabitacion),
      });
    } catch (error) {
      respuesta.status(400).json({
        mensaje: "fallamos en la operacion " + error,
      });
    }
  }


  async buscandoHabitaciones(peticion, respuesta) {
    let objetoServicioHabitacion = new ServicioHabitacion();
    try {
      respuesta.status(200).json({
        mensaje: "exito buscando habitaciones",
        habitaciones: await objetoServicioHabitacion.buscarTodas(),
      });
    } catch (error) {
      respuesta.status(500).json({
        mensaje: "fallamos en la operacion " + error,
      });
    }
  }


  async editandoHabitacion(peticion, respuesta) {
    let objetoServicioHabitacion = new ServicioHabitacion();
    try {
      let idHabitacion = peticion.params.idhabitacion;
      let datosHabitacion = peticion.body;
      await objetoServicioHabitacion.editar(idHabitacion, datosHabitacion);
      respuesta.status(200).json({
        mensaje: "exito editando habitacion",
      });
    } catch (error) {
      respuesta.status(400).json({
        mensaje: "fallamos en la operacion " + error,
      });
    }
  }

  
}
