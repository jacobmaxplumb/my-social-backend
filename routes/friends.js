const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getUserData, enrichRequests, sendFriendRequest } = require('../mockData');

/**
 * @swagger
 * /friends:
 *   get:
 *     summary: Get current friends for the authenticated user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [online, offline]
 *         description: Filter by online status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username (contains)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of friends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Friend'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', requireAuth, (req, res) => {
  const { status, search, limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;
  const userData = getUserData(userId);

  let friends = [...userData.friends];

  // Apply filters
  if (status) {
    friends = friends.filter(f => f.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    friends = friends.filter(f => f.username.toLowerCase().includes(searchLower));
  }

  // Pagination
  const total = friends.length;
  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);
  const paginatedFriends = friends.slice(offsetNum, offsetNum + limitNum);

  res.json({
    data: paginatedFriends,
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
    },
  });
});

/**
 * @swagger
 * /friends/suggestions:
 *   get:
 *     summary: Get friend suggestions for the authenticated user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of friend suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FriendSuggestion'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/suggestions', requireAuth, (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;
  const userData = getUserData(userId);

  const suggestions = [...userData.suggestions];

  // Pagination
  const total = suggestions.length;
  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);
  const paginatedSuggestions = suggestions.slice(offsetNum, offsetNum + limitNum);

  res.json({
    data: paginatedSuggestions,
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
    },
  });
});

/**
 * @swagger
 * /friends/requests:
 *   get:
 *     summary: Get pending friend requests for the authenticated user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [incoming, outgoing]
 *         description: Filter by request type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of pending friend requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PendingRequest'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/requests', requireAuth, (req, res) => {
  const { type, limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;
  const userData = getUserData(userId);

  let requests = [...userData.requests];

  // Apply filter
  if (type) {
    requests = requests.filter(r => r.type === type);
  }

  // Enrich with relativeTimestamp
  requests = enrichRequests(requests);

  // Pagination
  const total = requests.length;
  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);
  const paginatedRequests = requests.slice(offsetNum, offsetNum + limitNum);

  res.json({
    data: paginatedRequests,
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
    },
  });
});

/**
 * @swagger
 * /friends/request:
 *   post:
 *     summary: Send a friend request to another user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 example: "jane_doe"
 *                 description: Username of the user to send a friend request to
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PendingRequest'
 *       400:
 *         description: Validation error or already friends/request exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/request', requireAuth, (req, res) => {
  const { username } = req.body;
  const userId = req.user.id;

  if (!username || username.trim().length === 0) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Username is required',
      },
    });
  }

  if (username === req.user.username) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Cannot send friend request to yourself',
      },
    });
  }

  const result = sendFriendRequest(userId, username.trim());

  if (result.error === 'already_friends') {
    return res.status(400).json({
      error: {
        code: 'already_friends',
        message: 'You are already friends with this user',
      },
    });
  }

  if (result.error === 'request_already_sent') {
    return res.status(400).json({
      error: {
        code: 'request_already_sent',
        message: 'Friend request has already been sent to this user',
      },
    });
  }

  // Enrich with relativeTimestamp
  const enrichedRequest = enrichRequests([result])[0];

  res.status(201).json({
    data: enrichedRequest,
  });
});

module.exports = router;

