const pool = require('../database');

class AuthService {
  async addRefreshToken(token) {
    const query = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };
    await pool.query(query);
  }

  async verifyRefreshToken(token) {
    const query = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      throw new Error('Refresh token tidak valid');
    }
  }
}

module.exports = new AuthService();