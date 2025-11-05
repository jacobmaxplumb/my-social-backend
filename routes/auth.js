const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// In-memory user store (for mock purposes)
// In production, use a database
// Seed users: both 'alex' and 'sarah' have password 'password'
const users = [];

// Initialize seed users with hashed passwords
async function initializeSeedUsers() {
  const defaultPassword = 'password';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
  users.push(
    {
      id: 'alex',
      username: 'alex',
      password: hashedPassword,
    },
    {
      id: 'sarah',
      username: 'sarah',
      password: hashedPassword,
    }
  );
}

// Initialize on module load
initializeSeedUsers().catch(console.error);

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

  if (username.length < 3) {
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

  // Check if user already exists
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(409).json({
      error: {
        code: 'username_taken',
        message: 'Username is already taken',
      },
    });
  }

  // Create new user
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: username.toLowerCase(),
    username,
    password: hashedPassword,
  };
  users.push(newUser);

  // Generate JWT
  const token = jwt.sign(
    {
      sub: newUser.id,
      username: newUser.username,
    },
    process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
    },
  });
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

  // Find user
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({
      error: {
        code: 'invalid_credentials',
        message: 'Invalid username or password',
      },
    });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({
      error: {
        code: 'invalid_credentials',
        message: 'Invalid username or password',
      },
    });
  }

  // Generate JWT
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
      id: user.id,
      username: user.username,
    },
  });
});

module.exports = router;

