
import { pool } from '../database/mysql.js';

export class ServicioHabitacion {
  constructor() {}

  async registrar(datosHabitacion) {
    const { nombre, descripcion, precio, numeropersonas, foto } = datosHabitacion;
    const imagen = Array.isArray(foto) ? foto[0] : (foto || '');
    const [result] = await pool.execute(
      'INSERT INTO habitaciones (nombre, descripcion, precio, capacidad, imagen) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, precio, numeropersonas, imagen]
    );
    return { id: result.insertId, ...datosHabitacion };
  }

  async buscarTodas() {
    const [rows] = await pool.execute('SELECT * FROM habitaciones');
    return rows;
  }

  async buscarPorId(idHabitacion) {
    const [rows] = await pool.execute('SELECT * FROM habitaciones WHERE id = ?', [idHabitacion]);
    return rows[0];
  }

  async editar(idHabitacion, datosHabitacion) {
    const { nombre, descripcion, precio, numeropersonas, foto } = datosHabitacion;
    const imagen = Array.isArray(foto) ? foto[0] : (foto || '');
    await pool.execute(
      'UPDATE habitaciones SET nombre=?, descripcion=?, precio=?, capacidad=?, imagen=? WHERE id=?',
      [nombre, descripcion, precio, numeropersonas, imagen, idHabitacion]
    );
    return { id: idHabitacion, ...datosHabitacion };
  }
}
