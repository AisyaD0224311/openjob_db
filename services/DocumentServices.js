const pool = require('../database');
const fs = require('fs');

class DocumentService {
  async getAllDocuments() {
    const result = await pool.query('SELECT * FROM user_cvs ORDER BY uploaded_at DESC');
    return result.rows;
  }

  async getDocumentById(id) {
    const query = { text: 'SELECT * FROM user_cvs WHERE id = $1', values: [id] };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Dokumen tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    return result.rows[0];
  }

  async deleteDocument(id, userId) {
    // Get document first to check ownership and get file path
    const query = { text: 'SELECT * FROM user_cvs WHERE id = $1', values: [id] };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('Dokumen tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    const doc = result.rows[0];
    if (doc.user_id !== userId) {
      const error = new Error('Anda tidak berhak menghapus dokumen ini');
      error.statusCode = 403;
      throw error;
    }

    await pool.query('DELETE FROM user_cvs WHERE id = $1', [id]);

    // Try to delete the physical file, ignore errors if file not found
    try {
      if (fs.existsSync(doc.file_path)) {
        fs.unlinkSync(doc.file_path);
      }
    } catch (e) {
      // ignore
    }
  }
}

module.exports = new DocumentService();
