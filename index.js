import { API } from './API.js';
import * as dotenv from 'dotenv' 
dotenv.config()

let servidorHotel = new API()
servidorHotel.levantarServidor()