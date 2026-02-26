import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UsuarioSchema = new Schema(
	{
		nombre: {
			type: String,
			required: true,
			trim: true
		},
		apellido: {
			type: String,
			required: true,
			trim: true
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true
		},
		telefono: {
			type: String,
			default: ''
		},
		password: {
			type: String,
			required: true
		},
		rol: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user'
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

export const modeloUsuario = mongoose.model('usuarios', UsuarioSchema);
