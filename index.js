import { API } from './API.js';
import * as dotenv from 'dotenv' 
dotenv.config()

// global error handlers to aid debugging when running locally
process.on('uncaughtException', (err) => {
	console.error('UNCAUGHT EXCEPTION', err && (err.stack || err.message || err));
});
process.on('unhandledRejection', (reason) => {
	console.error('UNHANDLED REJECTION', reason && (reason.stack || reason.message || reason));
});

let servidorHotel = new API()

if (!process.env.VERCEL) {
	await servidorHotel.inicializar()
	servidorHotel.levantarServidor()
}

export default function handler(request, response) {
	return servidorHotel.app(request, response)
}