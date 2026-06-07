const pool = require('../database');
const { nanoid } = require('nanoid');

class JobService {
  async addJob({ title, description, company_id, category_id }) {
    const id = `job-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO jobs(id, title, description, company_id, category_id) VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, title, description, company_id, category_id],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getAllJobs({ title, companyName } = {}) {
    let queryText = `
      SELECT jobs.*, companies.name as company_name, categories.name as category_name
      FROM jobs
      LEFT JOIN companies ON jobs.company_id = companies.id
      LEFT JOIN categories ON jobs.category_id = categories.id
      WHERE 1=1
    `;
    const values = [];
    let counter = 1;

    if (title) {
      queryText += ` AND jobs.title ILIKE $${counter}`;
      values.push(`%${title}%`);
      counter++;
    }
    if (companyName) {
      queryText += ` AND companies.name ILIKE $${counter}`;
      values.push(`%${companyName}%`);
      counter++;
    }

    queryText += ' ORDER BY jobs.created_at DESC';
    const result = await pool.query(queryText, values);
    return result.rows;
  }

  async getJobById(id) {
    const query = {
      text: `SELECT jobs.*, companies.name as company_name, categories.name as category_name
             FROM jobs
             LEFT JOIN companies ON jobs.company_id = companies.id
             LEFT JOIN categories ON jobs.category_id = categories.id
             WHERE jobs.id = $1`,
      values: [id],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Job tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    return result.rows[0];
  }

  async getJobsByCompany(companyId) {
    const query = {
      text: `SELECT jobs.*, companies.name as company_name, categories.name as category_name
             FROM jobs
             LEFT JOIN companies ON jobs.company_id = companies.id
             LEFT JOIN categories ON jobs.category_id = categories.id
             WHERE jobs.company_id = $1
             ORDER BY jobs.created_at DESC`,
      values: [companyId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getJobsByCategory(categoryId) {
    const query = {
      text: `SELECT jobs.*, companies.name as company_name, categories.name as category_name
             FROM jobs
             LEFT JOIN companies ON jobs.company_id = companies.id
             LEFT JOIN categories ON jobs.category_id = categories.id
             WHERE jobs.category_id = $1
             ORDER BY jobs.created_at DESC`,
      values: [categoryId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async updateJob(id, { title, description, company_id, category_id }) {
    const query = {
      text: 'UPDATE jobs SET title=$1, description=$2, company_id=$3, category_id=$4 WHERE id=$5 RETURNING id',
      values: [title, description, company_id, category_id, id],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Job tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
  }

  async deleteJob(id) {
    const query = { text: 'DELETE FROM jobs WHERE id=$1 RETURNING id', values: [id] };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Job tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
  }
}

module.exports = new JobService();
