const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db/knex');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: newuser
 *               password:
 *                 type: string
 *                 example: securepassword
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Username already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Username and password are required',
      },
    });
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Username must be at least 3 characters',
      },
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Password must be at least 6 characters',
      },
    });
  }

  const normalizedUsername = trimmedUsername.toLowerCase();

  try {
    const existingUser = await db('users').whereRaw('lower(username) = ?', [normalizedUsername]).first();
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'username_taken',
          message: 'Username is already taken',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db('users').insert({
      username: normalizedUsername,
      password_hash: hashedPassword,
      profile_image: '👤',
      status: 'online',
    });

    const createdUser = await db('users').where({ username: normalizedUsername }).first();

    const token = jwt.sign(
      {
        sub: createdUser.id,
        username: createdUser.username,
      },
      process.env.JWT_SECRET || 'default-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: String(createdUser.id),
        username: createdUser.username,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to register user',
      },
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and get JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: alex
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Username and password are required',
      },
    });
  }

  const normalizedUsername = username.trim().toLowerCase();

  try {
    const user = await db('users').where({ username: normalizedUsername }).first();

    if (!user || !user.password_hash) {
      return res.status(401).json({
        error: {
          code: 'invalid_credentials',
          message: 'Invalid username or password',
        },
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: {
          code: 'invalid_credentials',
          message: 'Invalid username or password',
        },
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
      },
      process.env.JWT_SECRET || 'default-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: String(user.id),
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to login',
      },
    });
  }
});

module.exports = router;

