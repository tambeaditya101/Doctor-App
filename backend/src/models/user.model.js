import pool from '../config/db.js'; // pg connection
import {
  createUserQuery,
  findUserByEmailQuery,
} from '../queries/user.query.js';

export const findUserByEmail = async (email) => {
  const result = await pool.query(findUserByEmailQuery, [email]);
  return result.rows[0];
};

export const createUser = async (name, email, phone, hashedPassword) => {
  const result = await pool.query(createUserQuery, [
    name,
    email,
    phone,
    hashedPassword,
  ]);
  return result.rows[0];
};
