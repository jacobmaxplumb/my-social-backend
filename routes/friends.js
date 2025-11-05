const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getUserData, enrichRequests } = require('../mockData');

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

module.exports = router;

