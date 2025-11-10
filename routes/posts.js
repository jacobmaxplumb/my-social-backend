const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/knex');
const { toRelativeTime } = require('../utils/time');

const parseLimit = value => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 20;
  }
  return Math.min(parsed, 100);
};

const parseOffset = value => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

const formatComment = (comment, likeCounts, likedByUserSet) => {
  const likes = likeCounts.get(comment.id) ?? 0;

  return {
    id: String(comment.id),
    username: comment.username,
    profileImage: comment.profileImage,
    text: comment.text,
    timestamp: new Date(comment.createdAt).toISOString(),
    relativeTimestamp: toRelativeTime(comment.createdAt),
    likes,
    likedByCurrentUser: likedByUserSet.has(comment.id),
  };
};

const formatPost = (post, likeCounts, likedByUserSet, commentsByPostId, commentLikeCounts, commentLikedByUserSet) => {
  const likes = likeCounts.get(post.id) ?? 0;
  const comments = commentsByPostId.get(post.id) ?? [];

  return {
    id: String(post.id),
    username: post.username,
    profileImage: post.profileImage,
    timestamp: new Date(post.createdAt).toISOString(),
    relativeTimestamp: toRelativeTime(post.createdAt),
    text: post.text,
    likes,
    likedByCurrentUser: likedByUserSet.has(post.id),
    comments: comments.map(comment => formatComment(comment, commentLikeCounts, commentLikedByUserSet)),
  };
};

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
router.get('/', requireAuth, async (req, res) => {
  const limitNum = parseLimit(req.query.limit ?? 20);
  const offsetNum = parseOffset(req.query.offset ?? 0);
  const userId = Number(req.user.id);

  try {
    const totalResult = await db('posts').count({ count: '*' }).first();
    const total = Number(totalResult?.count ?? 0);

    const postRows = await db('posts as p')
      .join('users as u', 'p.user_id', 'u.id')
      .select(
        'p.id',
        'u.username',
        'u.profile_image as profileImage',
        'p.text',
        'p.created_at as createdAt'
      )
      .orderBy('p.created_at', 'desc')
      .limit(limitNum)
      .offset(offsetNum);

    const postIds = postRows.map(row => row.id);

    const postLikeCounts = new Map();
    const postLikedByUser = new Set();
    const commentsByPostId = new Map();
    const commentLikeCounts = new Map();
    const commentLikedByUser = new Set();

    if (postIds.length) {
      const likesCountsRows = await db('post_likes')
        .whereIn('post_id', postIds)
        .select('post_id')
        .count({ count: '*' })
        .groupBy('post_id');

      likesCountsRows.forEach(row => {
        postLikeCounts.set(row.post_id, Number(row.count));
      });

      const likedRows = await db('post_likes')
        .whereIn('post_id', postIds)
        .andWhere('user_id', userId)
        .select('post_id');

      likedRows.forEach(row => {
        postLikedByUser.add(row.post_id);
      });

      const commentRows = await db('comments as c')
        .join('users as u', 'c.user_id', 'u.id')
        .whereIn('c.post_id', postIds)
        .select(
          'c.id',
          'c.post_id',
          'u.username',
          'u.profile_image as profileImage',
          'c.text',
          'c.created_at as createdAt'
        )
        .orderBy('c.created_at', 'asc');

      commentRows.forEach(row => {
        const group = commentsByPostId.get(row.post_id) || [];
        group.push({
          id: row.id,
          postId: row.post_id,
          username: row.username,
          profileImage: row.profileImage,
          text: row.text,
          createdAt: row.createdAt,
        });
        commentsByPostId.set(row.post_id, group);
      });

      const commentIds = commentRows.map(row => row.id);

      if (commentIds.length) {
        const commentLikesRows = await db('comment_likes')
          .whereIn('comment_id', commentIds)
          .select('comment_id')
          .count({ count: '*' })
          .groupBy('comment_id');

        commentLikesRows.forEach(row => {
          commentLikeCounts.set(row.comment_id, Number(row.count));
        });

        const commentLikedRows = await db('comment_likes')
          .whereIn('comment_id', commentIds)
          .andWhere('user_id', userId)
          .select('comment_id');

        commentLikedRows.forEach(row => {
          commentLikedByUser.add(row.comment_id);
        });
      }
    }

    const data = postRows.map(row =>
      formatPost(
        {
          id: row.id,
          username: row.username,
          profileImage: row.profileImage,
          text: row.text,
          createdAt: row.createdAt,
        },
        postLikeCounts,
        postLikedByUser,
        commentsByPostId,
        commentLikeCounts,
        commentLikedByUser
      )
    );

    res.json({
      data,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to retrieve posts',
      },
    });
  }
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
router.post('/', requireAuth, async (req, res) => {
  const { text } = req.body;
  const userId = Number(req.user.id);

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

  const trimmedText = text.trim();
  const createdAt = new Date().toISOString();

  try {
    const [postId] = await db('posts').insert({
      user_id: userId,
      text: trimmedText,
      created_at: createdAt,
    });

    const postRow = await db('posts as p')
      .join('users as u', 'p.user_id', 'u.id')
      .select(
        'p.id',
        'u.username',
        'u.profile_image as profileImage',
        'p.text',
        'p.created_at as createdAt'
      )
      .where('p.id', postId)
      .first();

    const formatted = formatPost(
      {
        id: postRow.id,
        username: postRow.username,
        profileImage: postRow.profileImage,
        text: postRow.text,
        createdAt: postRow.createdAt,
      },
      new Map(),
      new Set(),
      new Map(),
      new Map(),
      new Set()
    );

    res.status(201).json(formatted);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to create post',
      },
    });
  }
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
router.post('/:postId/comments', requireAuth, async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = Number(req.user.id);

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

  const numericPostId = parseInt(postId, 10);

  if (Number.isNaN(numericPostId)) {
    return res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Post not found',
      },
    });
  }

  const trimmedText = text.trim();
  const createdAt = new Date().toISOString();

  try {
    const postExists = await db('posts').where({ id: numericPostId }).first();

    if (!postExists) {
      return res.status(404).json({
        error: {
          code: 'not_found',
          message: 'Post not found',
        },
      });
    }

    const [commentId] = await db('comments').insert({
      post_id: numericPostId,
      user_id: userId,
      text: trimmedText,
      created_at: createdAt,
    });

    const commentRow = await db('comments as c')
      .join('users as u', 'c.user_id', 'u.id')
      .select(
        'c.id',
        'u.username',
        'u.profile_image as profileImage',
        'c.text',
        'c.created_at as createdAt'
      )
      .where('c.id', commentId)
      .first();

    const formattedComment = {
      id: String(commentRow.id),
      username: commentRow.username,
      profileImage: commentRow.profileImage,
      text: commentRow.text,
      timestamp: new Date(commentRow.createdAt).toISOString(),
      relativeTimestamp: toRelativeTime(commentRow.createdAt),
      likes: 0,
      likedByCurrentUser: false,
    };

    res.status(201).json(formattedComment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to create comment',
      },
    });
  }
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
router.post('/:postId/like', requireAuth, async (req, res) => {
  const { postId } = req.params;
  const userId = Number(req.user.id);

  const numericPostId = parseInt(postId, 10);

  if (Number.isNaN(numericPostId)) {
    return res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Post not found',
      },
    });
  }

  try {
    const post = await db('posts').where({ id: numericPostId }).first();

    if (!post) {
      return res.status(404).json({
        error: {
          code: 'not_found',
          message: 'Post not found',
        },
      });
    }

    const existing = await db('post_likes')
      .where({
        post_id: numericPostId,
        user_id: userId,
      })
      .first();

    let liked = false;

    if (existing) {
      await db('post_likes')
        .where({
          post_id: numericPostId,
          user_id: userId,
        })
        .del();
    } else {
      await db('post_likes').insert({
        post_id: numericPostId,
        user_id: userId,
        created_at: new Date().toISOString(),
      });
      liked = true;
    }

    const countResult = await db('post_likes')
      .where({ post_id: numericPostId })
      .count({ count: '*' })
      .first();

    const likes = Number(countResult?.count ?? 0);

    res.json({ liked, likes });
  } catch (error) {
    console.error('Toggle post like error:', error);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to toggle like',
      },
    });
  }
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
router.post('/:postId/comments/:commentId/like', requireAuth, async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = Number(req.user.id);

  const numericPostId = parseInt(postId, 10);
  const numericCommentId = parseInt(commentId, 10);

  if (Number.isNaN(numericPostId) || Number.isNaN(numericCommentId)) {
    return res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Post or comment not found',
      },
    });
  }

  try {
    const comment = await db('comments')
      .where({
        id: numericCommentId,
        post_id: numericPostId,
      })
      .first();

    if (!comment) {
      return res.status(404).json({
        error: {
          code: 'not_found',
          message: 'Post or comment not found',
        },
      });
    }

    const existing = await db('comment_likes')
      .where({
        comment_id: numericCommentId,
        user_id: userId,
      })
      .first();

    let liked = false;

    if (existing) {
      await db('comment_likes')
        .where({
          comment_id: numericCommentId,
          user_id: userId,
        })
        .del();
    } else {
      await db('comment_likes').insert({
        comment_id: numericCommentId,
        user_id: userId,
        created_at: new Date().toISOString(),
      });
      liked = true;
    }

    const countResult = await db('comment_likes')
      .where({ comment_id: numericCommentId })
      .count({ count: '*' })
      .first();

    const likes = Number(countResult?.count ?? 0);

    res.json({ liked, likes });
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to toggle like',
      },
    });
  }
});

module.exports = router;

