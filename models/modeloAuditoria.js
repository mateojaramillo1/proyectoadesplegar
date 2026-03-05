import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AuditoriaSchema = new Schema(
  {
    evento: {
      type: String,
      required: true,
      trim: true
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'usuarios',
      required: false
    },
    actorEmail: {
      type: String,
      default: ''
    },
    rol: {
      type: String,
      default: 'anonimo'
    },
    entidad: {
      type: String,
      default: ''
    },
    entidadId: {
      type: String,
      default: ''
    },
    resultado: {
      type: String,
      enum: ['ok', 'error'],
      default: 'ok'
    },
    detalle: {
      type: String,
      default: ''
    },
    ip: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

AuditoriaSchema.index({ createdAt: -1 });
AuditoriaSchema.index({ evento: 1, createdAt: -1 });

export const modeloAuditoria = mongoose.model('auditorias', AuditoriaSchema);
