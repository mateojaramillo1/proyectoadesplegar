const WOMPI_API_BASE = process.env.WOMPI_API_BASE || 'https://production.wompi.co/v1';

export class ServicioPagoWompi {
  constructor() {
    this.privateKey = process.env.WOMPI_PRIVATE_KEY;
    this.publicKey = process.env.WOMPI_PUBLIC_KEY;
    this.redirectUrl = process.env.WOMPI_REDIRECT_URL || 'http://localhost:4200/alojamientos';
  }

  validarConfiguracion() {
    if (!this.privateKey) {
      throw new Error('Falta WOMPI_PRIVATE_KEY en variables de entorno');
    }
  }

  async crearLinkDePago({ referencia, montoEnCentavos, descripcion, emailCliente }) {
    this.validarConfiguracion();

    const payload = {
      name: `Reserva ${referencia}`,
      description: descripcion,
      single_use: true,
      collect_shipping: false,
      currency: 'COP',
      amount_in_cents: montoEnCentavos,
      redirect_url: this.redirectUrl,
      customer_data: {
        email: emailCliente
      }
    };

    const respuesta = await fetch(`${WOMPI_API_BASE}/payment_links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(`Wompi error creando link: ${JSON.stringify(data)}`);
    }

    const link = data?.data?.permalink;
    if (!link) {
      throw new Error('Wompi no devolvió permalink para el link de pago');
    }

    return {
      id: data?.data?.id,
      permalink: link,
      raw: data
    };
  }

  async consultarTransaccion(transactionId) {
    this.validarConfiguracion();

    const respuesta = await fetch(`${WOMPI_API_BASE}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(`Wompi error consultando transacción: ${JSON.stringify(data)}`);
    }

    return data?.data;
  }

  mapearEstadoPago(estadoWompi) {
    if (estadoWompi === 'APPROVED') {
      return {
        estadoPago: 'PAGADA',
        estadoReserva: 'CONFIRMADA'
      };
    }

    if (['DECLINED', 'ERROR', 'VOIDED'].includes(estadoWompi)) {
      return {
        estadoPago: 'FALLIDA',
        estadoReserva: 'CANCELADA'
      };
    }

    return {
      estadoPago: 'PENDIENTE',
      estadoReserva: 'PENDIENTE_PAGO'
    };
  }
}
