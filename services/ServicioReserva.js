import { modeloReserva } from "../models/modeloReserva.js";

function inicioDia(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDia(fecha) {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

function inicioMes(anio, mes) {
  return new Date(anio, mes - 1, 1, 0, 0, 0, 0);
}

function finMes(anio, mes) {
  return new Date(anio, mes, 0, 23, 59, 59, 999);
}

function solapa(inicioA, finA, inicioB, finB) {
  return inicioA < finB && finA > inicioB;
}

function contarNochesSolapadas(inicioReserva, finReserva, inicioRango, finRango) {
  const inicio = new Date(Math.max(new Date(inicioReserva).getTime(), inicioRango.getTime()));
  const fin = new Date(Math.min(new Date(finReserva).getTime(), finRango.getTime()));
  if (inicio >= fin) {
    return 0;
  }

  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.ceil((fin.getTime() - inicio.getTime()) / msPorDia);
}

function escapeCsv(valor) {
  const texto = String(valor ?? '');
  if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

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

  async obtenerDashboardAdmin({ desde, hasta, totalHabitaciones = 0 } = {}) {
    const query = {};
    if (desde || hasta) {
      query.fechainicio = {};
      if (desde) {
        query.fechainicio.$gte = inicioDia(desde);
      }
      if (hasta) {
        query.fechainicio.$lte = finDia(hasta);
      }
    }

    const reservas = await modeloReserva.find(query).lean();
    const totalReservas = reservas.length;
    const totalPendientes = reservas.filter(r => r.estado === 'pendiente').length;
    const totalAprobadas = reservas.filter(r => r.estado === 'aprobada').length;
    const totalRechazadas = reservas.filter(r => r.estado === 'rechazada').length;
    const totalPagosVerificados = reservas.filter(r => !!r.pagoVerificado).length;

    const ingresosReales = reservas
      .filter(r => r.estado === 'aprobada')
      .reduce((acc, r) => acc + Number(r.precioTotal || 0), 0);

    const ingresosProyectados = reservas
      .filter(r => r.estado === 'aprobada' || r.estado === 'pendiente')
      .reduce((acc, r) => acc + Number(r.precioTotal || 0), 0);

    const hoy = new Date();
    const habitacionesOcupadasHoy = await modeloReserva.distinct('idHabitacion', {
      estado: 'aprobada',
      fechainicio: { $lte: finDia(hoy) },
      fechafin: { $gt: inicioDia(hoy) }
    });

    const tasaOcupacionHoy = totalHabitaciones > 0
      ? Number(((habitacionesOcupadasHoy.length / totalHabitaciones) * 100).toFixed(1))
      : 0;

    const ocupacionMensual = [];
    for (let i = 11; i >= 0; i -= 1) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;
      const ini = inicioMes(anio, mes);
      const fin = finMes(anio, mes);
      const diasMes = fin.getDate();

      const reservasMes = reservas.filter(r => {
        const inicio = new Date(r.fechainicio);
        const salida = new Date(r.fechafin);
        return solapa(inicio, salida, ini, fin);
      });

      const ingresosRealesMes = reservasMes
        .filter(r => r.estado === 'aprobada')
        .reduce((acc, r) => acc + Number(r.precioTotal || 0), 0);

      const ingresosProyectadosMes = reservasMes
        .filter(r => r.estado === 'aprobada' || r.estado === 'pendiente')
        .reduce((acc, r) => acc + Number(r.precioTotal || 0), 0);

      let roomNights = 0;
      for (const reserva of reservasMes) {
        if (reserva.estado !== 'aprobada' && reserva.estado !== 'pendiente') {
          continue;
        }
        roomNights += contarNochesSolapadas(reserva.fechainicio, reserva.fechafin, ini, fin);
      }

      const capacidadRoomNights = Math.max(totalHabitaciones * diasMes, 1);
      const ocupacionPromedio = totalHabitaciones > 0
        ? Number(((roomNights / capacidadRoomNights) * 100).toFixed(1))
        : 0;

      ocupacionMensual.push({
        periodo: `${anio}-${String(mes).padStart(2, '0')}`,
        reservas: reservasMes.length,
        ingresosReales: ingresosRealesMes,
        ingresosProyectados: ingresosProyectadosMes,
        ocupacionPromedio
      });
    }

    return {
      kpis: {
        totalReservas,
        totalPendientes,
        totalAprobadas,
        totalRechazadas,
        totalPagosVerificados,
        ingresosReales,
        ingresosProyectados,
        tasaOcupacionHoy
      },
      ocupacionMensual
    };
  }

  async obtenerDisponibilidadMensual(idHabitacion, anio, mes) {
    const ini = inicioMes(anio, mes);
    const fin = finMes(anio, mes);

    const reservas = await modeloReserva.find({
      idHabitacion,
      estado: { $in: ['pendiente', 'aprobada'] },
      fechainicio: { $lte: fin },
      fechafin: { $gt: ini }
    }).lean();

    const totalDias = fin.getDate();
    const dias = [];
    for (let dia = 1; dia <= totalDias; dia += 1) {
      dias.push({ dia, fecha: new Date(anio, mes - 1, dia), reservas: 0, ocupada: false });
    }

    for (const reserva of reservas) {
      const inicio = new Date(reserva.fechainicio);
      const salida = new Date(reserva.fechafin);

      for (let dia = 1; dia <= totalDias; dia += 1) {
        const fechaDia = new Date(anio, mes - 1, dia);
        const inicioDiaActual = inicioDia(fechaDia);
        const finDiaActual = finDia(fechaDia);

        if (solapa(inicio, salida, inicioDiaActual, finDiaActual)) {
          dias[dia - 1].reservas += 1;
          dias[dia - 1].ocupada = true;
        }
      }
    }

    const diasOcupados = dias.filter(d => d.ocupada).length;
    const diasLibres = totalDias - diasOcupados;
    const porcentajeOcupacion = Number(((diasOcupados / totalDias) * 100).toFixed(1));

    return {
      anio,
      mes,
      totalDias,
      dias,
      resumen: {
        diasOcupados,
        diasLibres,
        porcentajeOcupacion,
        totalReservasMes: reservas.length
      }
    };
  }

  async exportarReservasCSV({ estado, pago, desde, hasta } = {}) {
    const query = {};

    if (estado && estado !== 'todos') {
      query.estado = estado;
    }

    if (pago && pago !== 'todos') {
      query.pagoVerificado = pago === 'verificado';
    }

    if (desde || hasta) {
      query.fechainicio = {};
      if (desde) {
        query.fechainicio.$gte = inicioDia(desde);
      }
      if (hasta) {
        query.fechainicio.$lte = finDia(hasta);
      }
    }

    const reservas = await modeloReserva.find(query).sort({ fechainicio: -1 }).lean();

    const encabezados = [
      'idReserva',
      'nombre',
      'apellido',
      'telefono',
      'idHabitacion',
      'fechaInicio',
      'fechaFin',
      'adultos',
      'ninos',
      'estado',
      'metodoPago',
      'pagoVerificado',
      'precioTotal',
      'noches'
    ];

    const lineas = [encabezados.join(',')];
    for (const r of reservas) {
      const fila = [
        r._id,
        r.nombre,
        r.apellido,
        r.telefono,
        r.idHabitacion,
        new Date(r.fechainicio).toISOString().slice(0, 10),
        new Date(r.fechafin).toISOString().slice(0, 10),
        Number(r.numeroadultos || 0),
        Number(r.numeroninos ?? r.numeroniños ?? 0),
        r.estado,
        r.metodoPago || 'efectivo',
        r.pagoVerificado ? 'si' : 'no',
        Number(r.precioTotal || 0),
        Number(r.noches || 0)
      ].map(escapeCsv);

      lineas.push(fila.join(','));
    }

    return lineas.join('\n');
  }
}
