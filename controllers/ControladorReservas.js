import { ServicioReserva } from "../services/ServicioReserva.js";
import { ServicioUsuario } from "../services/ServicioUsuario.js";
export class ControladorReservas {
  constructor() {}

  async registrandoReservas(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      // require authenticated user to create reservation so it is linked to their account
      if (!peticion.usuario || !peticion.usuario.id) {
        return respuesta.status(401).json({ mensaje: 'Debe iniciar sesión para crear una reserva' });
      }

      let datosReserva = peticion.body || {};
      // link reservation to user
      datosReserva.usuario = peticion.usuario.id;

      // override name/contact with user info (if available) to ensure reservation is under their name
      const servicioUsuario = new ServicioUsuario();
      const usuario = await servicioUsuario.buscarPorId(peticion.usuario.id);
      if (usuario) {
        datosReserva.nombre = usuario.nombre;
        datosReserva.apellido = usuario.apellido;
        if (!datosReserva.telefono) datosReserva.telefono = usuario.telefono || '';
      }

      if (datosReserva.fechainicio > datosReserva.fechafin) {
        respuesta.status(400).json({
          mensaje: "La fecha de ingreso debe de ser menor a la fecha de salida",
        });
      }
      
      else if (datosReserva.numeroniños > 0 && datosReserva.numeroadultos === 0) {
        respuesta.status(400).json({
          mensaje: "no pueden ingresar niños solos, ser requiere un adulto!!",
        });
      } 
      
      else {
        await objetoServicioReserva.registrar(datosReserva);
        respuesta.status(200).json({
          mensaje: "exito agregando datos reserva",
        });
      }

    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  async buscandoReserva(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      let idReserva = peticion.params.idreserva;
      respuesta.status(200).json({
        mensaje: "exito buscando la reserva",
        reserva: await objetoServicioReserva.buscarPorId(idReserva),
      });
    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  async buscandoReservas(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      respuesta.status(200).json({
        mensaje: "exito buscando reservas",
        reservas: await objetoServicioReserva.buscarTodas(),
      });
    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  async editandoReserva(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      let idReserva = peticion.params.idreserva;
      let datosReserva = peticion.body;
      await objetoServicioReserva.editar(idReserva, datosReserva);
      respuesta.status(200).json({
        mensaje: "exito editando reserva",
      });
    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  async eliminandoReserva(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva()

    try {
      let idReserva = peticion.params.idreserva;
      await objetoServicioReserva.eliminar(idReserva)
      respuesta.status(200).json({
        mensaje: "exito eliminando reserva",
      });
    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }
}
