const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getUserData, enrichPosts } = require('../mockData');

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get feed posts for the authenticated user
 *     tags: [Posts]
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
 *         description: List of feed posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', requireAuth, (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;
  const userData = getUserData(userId);

  // Get posts (feed includes user's posts and friends' posts)
  const posts = [...userData.posts];

  // Enrich with relativeTimestamp
  const enrichedPosts = enrichPosts(posts);

  // Pagination
  const total = enrichedPosts.length;
  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);
  const paginatedPosts = enrichedPosts.slice(offsetNum, offsetNum + limitNum);

  res.json({
    data: paginatedPosts,
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
    },
  });
});

module.exports = router;

