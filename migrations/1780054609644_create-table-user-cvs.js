exports.up = (pgm) => {
  pgm.createTable('user_cvs', {
    id: { type: 'VARCHAR(50)', primaryKey: true },
    user_id: { type: 'VARCHAR(50)', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    file_path: { type: 'TEXT', notNull: true },
    uploaded_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('current_timestamp') },
  });
};
exports.down = (pgm) => pgm.dropTable('user_cvs');