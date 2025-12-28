const pool = require('../database');

class RequestFormData {
  constructor() {
    this.pool = pool;
  }

  async create(requestFormData) {
    const query = `
      INSERT INTO request_form_data (full_name, company, email, phone, preferred_date, number_of_buildings, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      requestFormData.full_name,
      requestFormData.company,
      requestFormData.email,
      requestFormData.phone,
      requestFormData.preferred_date,
      requestFormData.number_of_buildings,
      requestFormData.message
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAll() {
    const query = 'SELECT * FROM request_form_data;';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async getById(id) {
    const query = 'SELECT * FROM request_form_data WHERE id = $1;';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

//   async update(id, updatedData) {
//     const query = `
//       UPDATE request_form_data
//       SET guest_id = $1,
//           room_id = $2,
//           check_in_date = $3,
//           check_out_date = $4,
//           status = $5
//       WHERE id = $6
//       RETURNING *;
//     `;
//     const values = [
//       updatedData.guest_id,
//       updatedData.room_id,
//       updatedData.check_in_date,
//       updatedData.check_out_date,
//       updatedData.status,
//       id
//     ];
//     const result = await this.pool.query(query, values);
//     return result.rows[0];
//   }

//   async delete(id) {
//     const query = 'DELETE FROM request_form_data WHERE id = $1 RETURNING *;';
//     const result = await this.pool.query(query, [id]);
//     return result.rows[0];
//   }
}

module.exports = new RequestFormData();