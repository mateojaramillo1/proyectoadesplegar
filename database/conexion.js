import mongoose from 'mongoose';

let conexionActiva = null;
let promesaConexion = null;

export async function establecerConexion(){
    try{
        if (conexionActiva && mongoose.connection.readyState === 1) {
            return conexionActiva;
        }

        if (promesaConexion) {
            return promesaConexion;
        }

        if(!process.env.DATABASE){
            throw new Error('La variable DATABASE no está configurada')
        }

        mongoose.set('bufferCommands', false)
        mongoose.set('bufferTimeoutMS', 3000)

        promesaConexion = mongoose.connect(process.env.DATABASE, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            maxPoolSize: 10
        })

        conexionActiva = await promesaConexion
        promesaConexion = null
        console.log("exito conectandonos a base de datos")
        return conexionActiva
    }catch(error){
        promesaConexion = null
        console.log("fallamos en la conexion a la base de datos "+error)
        throw error
    }
}