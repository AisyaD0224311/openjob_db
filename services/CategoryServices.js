const pool = require('../database');
const { nanoid } = require('nanoid');

class CategoryService {
  async addCategory({ name }) {
    const checkQuery = { text: 'SELECT id FROM categories WHERE name = $1', values: [name] };
    const checkResult = await pool.query(checkQuery);
    if (checkResult.rowCount > 0) {
      const error = new Error('Nama kategori sudah digunakan');
      error.statusCode = 400;
      throw error;
    }

    const id = `category-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO categories(id, name) VALUES($1, $2) RETURNING id',
      values: [id, name],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getAllCategories() {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    return result.rows;
  }

  async getCategoryById(id) {
    const query = { text: 'SELECT * FROM categories WHERE id = $1', values: [id] };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Kategori tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    return result.rows[0];
  }

  async updateCategory(id, { name }) {
    const query = {
      text: 'UPDATE categories SET name=$1 WHERE id=$2 RETURNING id',
      values: [name, id],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Kategori tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
  }

  async deleteCategory(id) {
    const query = { text: 'DELETE FROM categories WHERE id=$1 RETURNING id', values: [id] };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Kategori tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
  }
}

module.exports = new CategoryService();
