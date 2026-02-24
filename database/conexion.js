import mongoose from 'mongoose';

let conexionActiva = null;
let promesaConexion = null;

export async function establecerConexion(){
    try{
        console.log('Intentando conectar a la base de datos...');
        console.log('process.env.DATABASE:', process.env.DATABASE);
        if (conexionActiva && mongoose.connection.readyState === 1) {
            console.log('Ya existe una conexión activa.');
            return conexionActiva;
        }

        if (promesaConexion) {
            console.log('Ya hay una promesa de conexión en curso.');
            return promesaConexion;
        }

        if(!process.env.DATABASE){
            console.error('La variable DATABASE no está configurada');
            throw new Error('La variable DATABASE no está configurada')
        }


        mongoose.set('bufferCommands', false)
        mongoose.set('bufferTimeoutMS', 20000)

        promesaConexion = mongoose.connect(process.env.DATABASE, {
            serverSelectionTimeoutMS: 20000,
            connectTimeoutMS: 20000,
            socketTimeoutMS: 20000,
            maxPoolSize: 10
        })

        conexionActiva = await promesaConexion
        promesaConexion = null
        console.log("✅ Éxito conectándonos a base de datos")
        return conexionActiva
    }catch(error){
        promesaConexion = null
        console.error("❌ Fallamos en la conexión a la base de datos:", error);
        throw error
    }
}