import { ServicioReserva } from "../services/ServicioReserva.js";
import { ServicioUsuario } from "../services/ServicioUsuario.js";
import { ServicioHabitacion } from "../services/ServicioHabitacion.js";
import { ServicioPagoWompi } from "../services/ServicioPagoWompi.js";

function validarDatosReserva(datosReserva) {
  if (datosReserva.fechainicio > datosReserva.fechafin) {
    return "La fecha de ingreso debe de ser menor a la fecha de salida";
  }

  if (datosReserva.numeroniños > 0 && datosReserva.numeroadultos === 0) {
    return "no pueden ingresar niños solos, ser requiere un adulto!!";
  }

  return null;
}

function calcularNoches(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    return 0;
  }

  const diferencia = fin.getTime() - inicio.getTime();
  const noches = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  return noches > 0 ? noches : 0;
}

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

      const errorValidacion = validarDatosReserva(datosReserva);
      if (errorValidacion) {
        return respuesta.status(400).json({ mensaje: errorValidacion });
      }

      await objetoServicioReserva.registrar(datosReserva);
      return respuesta.status(200).json({
        mensaje: "exito agregando datos reserva",
      });

    } catch (error) {
      return respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  async iniciandoPagoPse(peticion, respuesta) {
    const objetoServicioReserva = new ServicioReserva();
    const servicioUsuario = new ServicioUsuario();
    const servicioHabitacion = new ServicioHabitacion();
    const servicioPagoWompi = new ServicioPagoWompi();

    try {
      if (!peticion.usuario || !peticion.usuario.id) {
        return respuesta.status(401).json({ mensaje: 'Debe iniciar sesión para pagar una reserva' });
      }

      const datosReserva = peticion.body || {};
      const habitacionId = datosReserva.idHabitacion;

      if (!habitacionId || !datosReserva.fechainicio || !datosReserva.fechafin) {
        return respuesta.status(400).json({
          mensaje: 'Faltan datos requeridos para iniciar el pago (idHabitacion, fechainicio, fechafin)'
        });
      }

      const usuario = await servicioUsuario.buscarPorId(peticion.usuario.id);
      if (!usuario) {
        return respuesta.status(401).json({ mensaje: 'Usuario no encontrado' });
      }

      const habitacion = await servicioHabitacion.buscarPorId(habitacionId);
      if (!habitacion) {
        return respuesta.status(404).json({ mensaje: 'Habitación no encontrada' });
      }

      datosReserva.usuario = peticion.usuario.id;
      datosReserva.nombre = usuario.nombre;
      datosReserva.apellido = usuario.apellido;
      datosReserva.telefono = datosReserva.telefono || usuario.telefono || 'NA';

      const errorValidacion = validarDatosReserva(datosReserva);
      if (errorValidacion) {
        return respuesta.status(400).json({ mensaje: errorValidacion });
      }

      const noches = calcularNoches(datosReserva.fechainicio, datosReserva.fechafin);
      if (noches <= 0) {
        return respuesta.status(400).json({ mensaje: 'La reserva debe tener al menos 1 noche' });
      }

      const montoTotal = Number(habitacion.precio) * noches;
      const montoEnCentavos = Math.round(montoTotal * 100);
      const referenciaPago = `RES-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      const reservaCreada = await objetoServicioReserva.registrar({
        ...datosReserva,
        montoTotal,
        moneda: 'COP',
        referenciaPago,
        estadoPago: 'PENDIENTE',
        estadoReserva: 'PENDIENTE_PAGO'
      });

      const descripcion = `Reserva habitación ${habitacion.nombre} (${noches} noche(s))`;
      const linkPago = await servicioPagoWompi.crearLinkDePago({
        referencia: referenciaPago,
        montoEnCentavos,
        descripcion,
        emailCliente: usuario.email
      });

      await objetoServicioReserva.editar(reservaCreada._id, {
        wompiPaymentLink: linkPago.permalink
      });

      return respuesta.status(201).json({
        mensaje: 'Pago PSE iniciado correctamente',
        reservaId: reservaCreada._id,
        referenciaPago,
        montoTotal,
        moneda: 'COP',
        checkoutUrl: linkPago.permalink
      });
    } catch (error) {
      return respuesta.status(500).json({
        mensaje: 'Error iniciando pago PSE: ' + error.message
      });
    }
  }

  async webhookWompi(peticion, respuesta) {
    const objetoServicioReserva = new ServicioReserva();
    const servicioPagoWompi = new ServicioPagoWompi();

    try {
      const evento = peticion.body || {};
      const transaccionEvento = evento?.data?.transaction || evento?.transaction || null;
      const transactionId = transaccionEvento?.id;

      if (!transactionId) {
        return respuesta.status(200).json({ mensaje: 'Webhook recibido sin transacción' });
      }

      const transaccion = await servicioPagoWompi.consultarTransaccion(transactionId);
      const referenciaPago = transaccion?.reference;

      if (!referenciaPago) {
        return respuesta.status(200).json({ mensaje: 'Transacción sin referencia' });
      }

      const estados = servicioPagoWompi.mapearEstadoPago(transaccion?.status);
      await objetoServicioReserva.actualizarPorReferenciaPago(referenciaPago, {
        ...estados,
        wompiTransactionId: String(transactionId)
      });

      return respuesta.status(200).json({ mensaje: 'Webhook procesado correctamente' });
    } catch (error) {
      return respuesta.status(500).json({ mensaje: 'Error procesando webhook: ' + error.message });
    }
  }

  async consultandoEstadoPagoWompi(peticion, respuesta) {
    const objetoServicioReserva = new ServicioReserva();
    const servicioPagoWompi = new ServicioPagoWompi();

    try {
      const transactionId = peticion.params.transactionId;
      if (!transactionId) {
        return respuesta.status(400).json({ mensaje: 'transactionId es requerido' });
      }

      const transaccion = await servicioPagoWompi.consultarTransaccion(transactionId);
      const referenciaPago = transaccion?.reference;
      const estados = servicioPagoWompi.mapearEstadoPago(transaccion?.status);

      let reservaActualizada = null;
      if (referenciaPago) {
        reservaActualizada = await objetoServicioReserva.actualizarPorReferenciaPago(referenciaPago, {
          ...estados,
          wompiTransactionId: String(transactionId)
        });
      }

      return respuesta.status(200).json({
        mensaje: 'Estado de pago consultado correctamente',
        transaccion: {
          id: transaccion?.id || String(transactionId),
          status: transaccion?.status || 'PENDING',
          reference: referenciaPago || null,
          amount_in_cents: transaccion?.amount_in_cents || 0,
          currency: transaccion?.currency || 'COP'
        },
        reserva: reservaActualizada
          ? {
              id: reservaActualizada._id,
              referenciaPago: reservaActualizada.referenciaPago,
              estadoPago: reservaActualizada.estadoPago,
              estadoReserva: reservaActualizada.estadoReserva,
              montoTotal: reservaActualizada.montoTotal,
              moneda: reservaActualizada.moneda
            }
          : null
      });
    } catch (error) {
      return respuesta.status(500).json({ mensaje: 'Error consultando estado de pago: ' + error.message });
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
