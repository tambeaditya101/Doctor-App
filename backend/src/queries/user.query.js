export const findUserByEmailQuery = `SELECT * FROM users WHERE email = $1`;

export const createUserQuery = `INSERT INTO users (name, email, phone, password_hash, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING public_id, name, email`;
