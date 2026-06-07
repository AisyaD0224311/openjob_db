const pool = require('../database');
const { nanoid } = require('nanoid');

class BookmarkService {
  async addBookmark({ user_id, job_id }) {
    const checkQuery = {
      text: 'SELECT id FROM bookmarks WHERE user_id=$1 AND job_id=$2',
      values: [user_id, job_id],
    };
    const checkResult = await pool.query(checkQuery);
    if (checkResult.rowCount > 0) {
      const error = new Error('Job sudah di-bookmark');
      error.statusCode = 400;
      throw error;
    }

    const id = `bookmark-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO bookmarks(id, user_id, job_id) VALUES($1, $2, $3) RETURNING id',
      values: [id, user_id, job_id],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getBookmarkById(id) {
    const query = {
      text: `SELECT bookmarks.*, jobs.title as job_title, companies.name as company_name
             FROM bookmarks
             LEFT JOIN jobs ON bookmarks.job_id = jobs.id
             LEFT JOIN companies ON jobs.company_id = companies.id
             WHERE bookmarks.id = $1`,
      values: [id],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Bookmark tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    return result.rows[0];
  }

  async getAllBookmarksByUser(userId) {
    const query = {
      text: `SELECT bookmarks.*, jobs.title as job_title, jobs.description as job_description,
             companies.name as company_name
             FROM bookmarks
             LEFT JOIN jobs ON bookmarks.job_id = jobs.id
             LEFT JOIN companies ON jobs.company_id = companies.id
             WHERE bookmarks.user_id = $1
             ORDER BY bookmarks.created_at DESC`,
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async deleteBookmarkByUserAndJob(userId, jobId) {
    const query = {
      text: 'DELETE FROM bookmarks WHERE user_id=$1 AND job_id=$2 RETURNING id',
      values: [userId, jobId],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Bookmark tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
  }
}

module.exports = new BookmarkService();
