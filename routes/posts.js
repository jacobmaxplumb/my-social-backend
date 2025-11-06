const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getUserData, enrichPosts, createPost, addComment, getRelativeTimestamp, togglePostLike, toggleCommentLike } = require('../mockData');
// comment
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

  // Enrich with relativeTimestamp and likedByCurrentUser
  const enrichedPosts = enrichPosts(posts, userId);

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

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Just finished a great workout! 💪"
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', requireAuth, (req, res) => {
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Post text is required',
      },
    });
  }

  if (text.length > 5000) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Post text must be 5000 characters or less',
      },
    });
  }

  const newPost = createPost(userId, text.trim());
  const enrichedPost = enrichPosts([newPost], userId)[0];

  res.status(201).json(enrichedPost);
});

/**
 * @swagger
 * /posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Great post!"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:postId/comments', requireAuth, (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Comment text is required',
      },
    });
  }

  if (text.length > 1000) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Comment text must be 1000 characters or less',
      },
    });
  }

  const newComment = addComment(userId, postId, text.trim());

  if (!newComment) {
    return res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Post not found',
      },
    });
  }

  // Enrich with relativeTimestamp and likedByCurrentUser
  const enrichedComment = {
    ...newComment,
    relativeTimestamp: getRelativeTimestamp(newComment.timestamp),
    likes: newComment.likedBy ? newComment.likedBy.length : 0,
    likedByCurrentUser: false, // New comment, not liked yet
  };

  res.status(201).json(enrichedComment);
});

/**
 * @swagger
 * /posts/{postId}/like:
 *   post:
 *     summary: Toggle like on a post (like if not liked, unlike if already liked)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to like/unlike
 *     responses:
 *       200:
 *         description: Like status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *                   description: Whether the post is now liked by the current user
 *                 likes:
 *                   type: number
 *                   description: Total number of likes on the post
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:postId/like', requireAuth, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const result = togglePostLike(userId, postId);

  if (!result) {
    return res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Post not found',
      },
    });
  }

  res.json(result);
});

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}/like:
 *   post:
 *     summary: Toggle like on a comment (like if not liked, unlike if already liked)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to like/unlike
 *     responses:
 *       200:
 *         description: Like status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *                   description: Whether the comment is now liked by the current user
 *                 likes:
 *                   type: number
 *                   description: Total number of likes on the comment
 *       404:
 *         description: Post or comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:postId/comments/:commentId/like', requireAuth, (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id;

  const result = toggleCommentLike(userId, postId, commentId);

  if (!result) {
    return res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Post or comment not found',
      },
    });
  }

  res.json(result);
});

module.exports = router;

