import { API } from './API.js';
import * as dotenv from 'dotenv' 
dotenv.config()

let servidorHotel = new API()

if (!process.env.VERCEL) {
	await servidorHotel.inicializar()
	servidorHotel.levantarServidor()
}

export default function handler(request, response) {
	return servidorHotel.app(request, response)
}