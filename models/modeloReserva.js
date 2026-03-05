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
    }
    ,
    estado: {
        type: String,
        enum: ['pendiente', 'aprobada', 'rechazada'],
        default: 'pendiente'
    },
    metodoPago: {
        type: String,
        enum: ['efectivo', 'transferencia'],
        default: 'efectivo'
    },
    pagoVerificado: {
        type: Boolean,
        default: false
    },
    precioTotal: {
        type: Number,
        default: 0
    },
    noches: {
        type: Number,
        default: 1
    }

}, {
    timestamps: true,
    versionKey: false
})

Reserva.index({ idHabitacion: 1, fechainicio: 1, fechafin: 1, estado: 1 });
Reserva.index({ usuario: 1, fechainicio: -1 });

export const modeloReserva=mongoose.model('reservas',Reserva)