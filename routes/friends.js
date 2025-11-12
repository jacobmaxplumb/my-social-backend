const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/knex');
const { toRelativeTime } = require('../utils/time');

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
router.get('/', requireAuth, async (req, res) => {
  const { status, search, limit = 20, offset = 0 } = req.query;
  const userId = Number(req.user.id);

  const limitNum = Number.isNaN(Number(limit)) ? 20 : parseInt(limit, 10);
  const offsetNum = Number.isNaN(Number(offset)) ? 0 : parseInt(offset, 10);

  try {
    const baseQuery = db('friendships as f')
      .join('users as u', 'f.friend_user_id', 'u.id')
      .where('f.user_id', userId);

    if (status) {
      baseQuery.andWhere('f.status', status);
    }

    if (search) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      baseQuery.andWhereRaw('lower(u.username) LIKE ?', [searchTerm]);
    }

    const totalResult = await baseQuery.clone().count({ count: '*' }).first();
    const total = Number(totalResult?.count ?? 0);

    const rows = await baseQuery
      .clone()
      .select(
        'f.id',
        'u.username',
        'u.profile_image as profileImage',
        'f.status',
        'f.mutual_friends as mutualFriends'
      )
      .orderBy('u.username', 'asc')
      .limit(limitNum)
      .offset(offsetNum);

    const data = rows.map(row => ({
      id: String(row.id),
      username: row.username,
      profileImage: row.profileImage,
      status: row.status || null,
      mutualFriends: row.mutualFriends ?? 0,
    }));

    res.json({
      data,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    console.error('Fetch friends error:', error);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to retrieve friends',
      },
    });
  }
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
router.get('/suggestions', requireAuth, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const userId = Number(req.user.id);

  const limitNum = Number.isNaN(Number(limit)) ? 20 : parseInt(limit, 10);
  const offsetNum = Number.isNaN(Number(offset)) ? 0 : parseInt(offset, 10);

  try {
    const baseQuery = db('friend_suggestions as fs')
      .join('users as u', 'fs.suggested_user_id', 'u.id')
      .where('fs.user_id', userId);

    const totalResult = await baseQuery.clone().count({ count: '*' }).first();
    const total = Number(totalResult?.count ?? 0);

    const rows = await baseQuery
      .clone()
      .select(
        'fs.id',
        'u.username',
        'u.profile_image as profileImage',
        'fs.mutual_friends as mutualFriends'
      )
      .orderBy('fs.created_at', 'desc')
      .limit(limitNum)
      .offset(offsetNum);

    const data = rows.map(row => ({
      id: String(row.id),
      username: row.username,
      profileImage: row.profileImage,
      mutualFriends: row.mutualFriends ?? 0,
    }));

    res.json({
      data,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    console.error('Fetch friend suggestions error:', error);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to retrieve friend suggestions',
      },
    });
  }
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
router.get('/requests', requireAuth, async (req, res) => {
  const { type, limit = 20, offset = 0 } = req.query;
  const userId = Number(req.user.id);

  const limitNum = Number.isNaN(Number(limit)) ? 20 : parseInt(limit, 10);
  const offsetNum = Number.isNaN(Number(offset)) ? 0 : parseInt(offset, 10);

  const includeIncoming = !type || type === 'incoming';
  const includeOutgoing = !type || type === 'outgoing';

  try {
    let aggregated = [];

    if (includeIncoming) {
      const incoming = await db('friend_requests as fr')
        .join('users as u', 'fr.sender_user_id', 'u.id')
        .select(
          'fr.id',
          'u.username',
          'u.profile_image as profileImage',
          'fr.mutual_friends as mutualFriends',
          'fr.created_at as createdAt'
        )
        .where('fr.receiver_user_id', userId)
        .orderBy('fr.created_at', 'desc');

      aggregated = aggregated.concat(
        incoming.map(row => ({
          id: String(row.id),
          username: row.username,
          profileImage: row.profileImage,
          mutualFriends: row.mutualFriends ?? 0,
          type: 'incoming',
          sentAt: new Date(row.createdAt).toISOString(),
          relativeTimestamp: toRelativeTime(row.createdAt),
        }))
      );
    }

    if (includeOutgoing) {
      const outgoing = await db('friend_requests as fr')
        .join('users as u', 'fr.receiver_user_id', 'u.id')
        .select(
          'fr.id',
          'u.username',
          'u.profile_image as profileImage',
          'fr.mutual_friends as mutualFriends',
          'fr.created_at as createdAt'
        )
        .where('fr.sender_user_id', userId)
        .orderBy('fr.created_at', 'desc');

      aggregated = aggregated.concat(
        outgoing.map(row => ({
          id: String(row.id),
          username: row.username,
          profileImage: row.profileImage,
          mutualFriends: row.mutualFriends ?? 0,
          type: 'outgoing',
          sentAt: new Date(row.createdAt).toISOString(),
          relativeTimestamp: toRelativeTime(row.createdAt),
        }))
      );
    }

    aggregated.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    const total = aggregated.length;
    const paginated = aggregated.slice(offsetNum, offsetNum + limitNum);

    res.json({
      data: paginated,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    console.error('Fetch friend requests error:', error);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to retrieve friend requests',
      },
    });
  }
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
router.post('/request', requireAuth, async (req, res) => {
  const { username } = req.body;
  const userId = Number(req.user.id);

  if (!username || username.trim().length === 0) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Username is required',
      },
    });
  }

  const normalized = username.trim().toLowerCase();

  if (normalized === req.user.username) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Cannot send friend request to yourself',
      },
    });
  }

  try {
    const targetUser = await db('users').where({ username: normalized }).first();

    if (!targetUser) {
      return res.status(404).json({
        error: {
          code: 'user_not_found',
          message: 'Target user was not found',
        },
      });
    }

    const existingFriendship = await db('friendships')
      .where({
        user_id: userId,
        friend_user_id: targetUser.id,
      })
      .first();

    if (existingFriendship) {
      return res.status(400).json({
        error: {
          code: 'already_friends',
          message: 'You are already friends with this user',
        },
      });
    }

    const existingRequest = await db('friend_requests')
      .where({
        sender_user_id: userId,
        receiver_user_id: targetUser.id,
      })
      .first();

    if (existingRequest) {
      return res.status(400).json({
        error: {
          code: 'request_already_sent',
          message: 'Friend request has already been sent to this user',
        },
      });
    }

    const reverseRequest = await db('friend_requests')
      .where({
        sender_user_id: targetUser.id,
        receiver_user_id: userId,
      })
      .first();

    if (reverseRequest) {
      return res.status(400).json({
        error: {
          code: 'request_exists',
          message: 'This user has already sent you a friend request',
        },
      });
    }

    const createdAt = new Date().toISOString();

    const [requestResult] = await db('friend_requests').insert({
      sender_user_id: userId,
      receiver_user_id: targetUser.id,
      mutual_friends: 0,
      status: 'pending',
      created_at: createdAt,
    }).returning('id');
    const requestId = requestResult?.id ?? requestResult;

    res.status(201).json({
      data: {
        id: String(requestId),
        username: targetUser.username,
        profileImage: targetUser.profile_image || null,
        mutualFriends: 0,
        type: 'outgoing',
        sentAt: createdAt,
        relativeTimestamp: toRelativeTime(createdAt),
      },
    });
  } catch (error) {
    console.error('Create friend request error:', error);
    res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Failed to create friend request',
      },
    });
  }
});

module.exports = router;

