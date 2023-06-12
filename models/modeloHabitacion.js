import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Habitacion = new Schema({
    nombre:{
        type:String,
        required:true
    },
    foto:{
        type:[String],
        required:true
    },
    descripcion:{
        type:String,
        required:true
    },
    precio:{
        type:Number,
        required:true
    },
    numeropersonas:{
        type:Number,
        required:true
    }

})

export const modeloHabitacion=mongoose.model('habitaciones',Habitacion)