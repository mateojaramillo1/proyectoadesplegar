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

})

export const modeloReserva=mongoose.model('reservas',Reserva)