const pool = require('../database');
const { nanoid } = require('nanoid');

class ApplicationService {
  async addApplication({ user_id, job_id }) {
    // Check if already applied
    const checkQuery = {
      text: 'SELECT id FROM applications WHERE user_id=$1 AND job_id=$2',
      values: [user_id, job_id],
    };
    const checkResult = await pool.query(checkQuery);
    if (checkResult.rowCount > 0) {
      const error = new Error('Anda sudah melamar pekerjaan ini');
      error.statusCode = 400;
      throw error;
    }

    const id = `application-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO applications(id, user_id, job_id) VALUES($1, $2, $3) RETURNING id',
      values: [id, user_id, job_id],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getAllApplications() {
    const result = await pool.query(`
      SELECT applications.*, users.username, users.fullname, jobs.title as job_title
      FROM applications
      LEFT JOIN users ON applications.user_id = users.id
      LEFT JOIN jobs ON applications.job_id = jobs.id
      ORDER BY applications.applied_at DESC
    `);
    return result.rows;
  }

  async getApplicationById(id) {
    const query = {
      text: `SELECT applications.*, users.username, users.fullname, jobs.title as job_title
             FROM applications
             LEFT JOIN users ON applications.user_id = users.id
             LEFT JOIN jobs ON applications.job_id = jobs.id
             WHERE applications.id = $1`,
      values: [id],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Lamaran tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    return result.rows[0];
  }

  async getApplicationsByUser(userId) {
    const query = {
      text: `SELECT applications.*, jobs.title as job_title, companies.name as company_name
             FROM applications
             LEFT JOIN jobs ON applications.job_id = jobs.id
             LEFT JOIN companies ON jobs.company_id = companies.id
             WHERE applications.user_id = $1
             ORDER BY applications.applied_at DESC`,
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getApplicationsByJob(jobId) {
    const query = {
      text: `SELECT applications.*, users.username, users.fullname, users.email
             FROM applications
             LEFT JOIN users ON applications.user_id = users.id
             WHERE applications.job_id = $1
             ORDER BY applications.applied_at DESC`,
      values: [jobId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async updateApplicationStatus(id, { status }) {
    const validStatuses = ['pending', 'accepted', 'rejected', 'reviewed'];
    if (!validStatuses.includes(status)) {
      const error = new Error('Status tidak valid');
      error.statusCode = 400;
      throw error;
    }
    const query = {
      text: 'UPDATE applications SET status=$1 WHERE id=$2 RETURNING id',
      values: [status, id],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Lamaran tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
  }

  async deleteApplication(id) {
    const query = { text: 'DELETE FROM applications WHERE id=$1 RETURNING id', values: [id] };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Lamaran tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
  }
}

module.exports = new ApplicationService();
