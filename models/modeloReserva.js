import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Reserva = new Schema({
    nombre:{
        type:String,
        required:true
    },
    apellido:{
        type:String,
        required:true
    },
    telefono:{
        type:String,
        required:true
    },
    fechainicio:{
        type:Date,
        required:true
    },
    fechafin:{
        type:Date,
        required:true
    },
    idHabitacion:{
        type:String,
        required:true
    },
    numeroniños:{
        type:Number,
        required:true
    },
    numeroadultos:{
        type:Number,
        required:true
    },
    numeropersonas:{
        type:Number,
        required:true
    }
    ,
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'usuarios',
        required: false
    },
    estadoPago: {
        type: String,
        enum: ['PENDIENTE', 'PAGADA', 'FALLIDA'],
        default: 'PENDIENTE'
    },
    estadoReserva: {
        type: String,
        enum: ['PENDIENTE_PAGO', 'CONFIRMADA', 'CANCELADA'],
        default: 'PENDIENTE_PAGO'
    },
    montoTotal: {
        type: Number,
        required: false,
        default: 0
    },
    moneda: {
        type: String,
        default: 'COP'
    },
    referenciaPago: {
        type: String,
        unique: true,
        sparse: true
    },
    wompiTransactionId: {
        type: String,
        required: false
    },
    wompiPaymentLink: {
        type: String,
        required: false
    }

}, { timestamps: true })

export const modeloReserva=mongoose.model('reservas',Reserva)