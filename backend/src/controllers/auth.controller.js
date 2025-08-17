import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../models/user.model.js';
import { errorResponse, successResponse } from '../utils/response.js';

// helper to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// Format safe user object
const formatUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
});

// --- Register ---
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return errorResponse(res, 'All fields are required', 400);
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'Email already in use', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(name, email, phone, hashedPassword);

    return successResponse(
      res,
      'User created successfully',
      {
        user: formatUserResponse(user),
      },
      201
    );
  } catch (err) {
    return errorResponse(res, 'Server error: ' + err.message, 500);
  }
};

// --- Login ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user);

    return successResponse(res, 'Login successful', {
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    return errorResponse(res, 'Server error: ' + err.message, 500);
  }
};
