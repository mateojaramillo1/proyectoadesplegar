import { ServicioHabitacion } from "../services/ServicioHabitacion.js";
export class ControladorHabitaciones {
  constructor() {}

  
  async registrandoHabitacion(peticion, respuesta) {
    let objetoServicioHabitacion = new ServicioHabitacion();
    try {
      let datosHabitacion = peticion.body;

      if(datosHabitacion.numeropersonas<2||datosHabitacion.numeropersonas>=5){
        respuesta.status(400).json({
          "mensaje":"Revise la cantidad de perasonas ingresadas!!"
        })
      }

      else if(datosHabitacion.precio<100000){
        respuesta.status(400).json({
          "mensaje":"Revise el precio por noche!!"
        })
      }


      else{
        await objetoServicioHabitacion.registrar(datosHabitacion);
        respuesta.status(200).json({
          mensaje: "exito agregando datos",
        });
      }
      
    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
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
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
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
