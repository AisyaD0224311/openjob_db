const pool = require('../database');
const { nanoid } = require('nanoid');

class CompanyService {
  async addCompany({ name, description, location }) {
    const id = `company-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO companies(id, name, description, location) VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, name, description, location],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getAllCompanies() {
    const result = await pool.query('SELECT * FROM companies ORDER BY name');
    return result.rows;
  }

  async getCompanyById(id) {
    const query = { text: 'SELECT * FROM companies WHERE id = $1', values: [id] };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Company tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    return result.rows[0];
  }

  async updateCompany(id, { name, description, location }) {
    const query = {
      text: 'UPDATE companies SET name=$1, description=$2, location=$3 WHERE id=$4 RETURNING id',
      values: [name, description, location, id],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Company tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
  }

  async deleteCompany(id) {
    const query = { text: 'DELETE FROM companies WHERE id=$1 RETURNING id', values: [id] };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Company tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
  }
}

module.exports = new CompanyService();
