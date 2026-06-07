const pool = require('../database');
const { nanoid } = require('nanoid'); 
const bcrypt = require('bcrypt');

class UserService {
    async addUser({ username, password, fullname, email }) {
        const queryCheck = {
            text: 'SELECT username FROM users WHERE username = $1 OR email = $2',
            values: [username, email],
        };
        const resultCheck = await pool.query(queryCheck);

        if (resultCheck.rowCount > 0) {
            throw new Error('Username atau email sudah digunakan');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = `user-${nanoid(16)}`;

        const query = {
            text: 'INSERT INTO users VALUES($1, $2, $3, $4, $5) RETURNING id',
            values: [id, username, hashedPassword, fullname, email],
        };

        const result = await pool.query(query);
        return result.rows[0].id;
    }

    async verifyUserCredential(username, password) {
        const query = {
            text: 'SELECT id, password FROM users WHERE username = $1',
            values: [username],
        };

        const result = await pool.query(query);

        if (!result.rowCount) {
            throw new Error('Kredensial yang Anda berikan salah');
        }

        const { id, password: hashedPassword } = result.rows[0];

        const match = await bcrypt.compare(password, hashedPassword);

        if (!match) {
            throw new Error('Kredensial yang Anda berikan salah');
        }

        return id;
    }
}

module.exports = new UserService();