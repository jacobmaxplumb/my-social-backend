const bcrypt = require('bcrypt');

const HOURS = 60 * 60 * 1000;
const DAYS = 24 * HOURS;

const now = Date.now();

const hoursAgo = hours => new Date(now - hours * HOURS).toISOString();
const daysAgo = days => new Date(now - days * DAYS).toISOString();

/**
 * @param {import('knex')} knex
 */
exports.seed = async function seed(knex) {
  await knex('comment_likes').del();
  await knex('comments').del();
  await knex('post_likes').del();
  await knex('posts').del();
  await knex('friend_requests').del();
  await knex('friend_suggestions').del();
  await knex('friendships').del();
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('password', 10);

  const usersSeed = [
    { username: 'alex', profile_image: '👨', status: 'online', password_hash: hashedPassword },
    { username: 'sarah', profile_image: '👩', status: 'online', password_hash: hashedPassword },
    { username: 'alex_johnson', profile_image: '👨', status: 'online' },
    { username: 'sarah_chen', profile_image: '👩', status: 'online' },
    { username: 'mike_williams', profile_image: '👨', status: 'offline' },
    { username: 'emma_davis', profile_image: '👩', status: 'online' },
    { username: 'david_brown', profile_image: '👨', status: 'offline' },
    { username: 'lisa_anderson', profile_image: '👩', status: 'online' },
    { username: 'james_wilson', profile_image: '👨', status: 'online' },
    { username: 'olivia_martinez', profile_image: '👩', status: 'online' },
    { username: 'ryan_taylor', profile_image: '👨', status: 'online' },
    { username: 'sophia_lee', profile_image: '👩', status: 'online' },
    { username: 'chris_miller', profile_image: '👨', status: 'online' },
    { username: 'amanda_white', profile_image: '👩', status: 'online' },
    { username: 'benjamin_clark', profile_image: '👨', status: 'online' },
    { username: 'natalie_kim', profile_image: '👩', status: 'online' },
    { username: 'thomas_moore', profile_image: '👨', status: 'online' },
  ];

  await knex('users').insert(usersSeed);

  const users = await knex('users').select('id', 'username');
  const userIdByUsername = users.reduce((acc, user) => {
    acc[user.username] = user.id;
    return acc;
  }, {});

  const friendshipsSeed = [
    // Alex's friends
    { user: 'alex', friend: 'alex_johnson', status: 'online', mutualFriends: 5 },
    { user: 'alex', friend: 'sarah_chen', status: 'online', mutualFriends: 8 },
    { user: 'alex', friend: 'mike_williams', status: 'offline', mutualFriends: 3 },
    { user: 'alex', friend: 'emma_davis', status: 'online', mutualFriends: 12 },
    { user: 'alex', friend: 'david_brown', status: 'offline', mutualFriends: 7 },
    // Sarah's friends
    { user: 'sarah', friend: 'alex_johnson', status: 'online', mutualFriends: 8 },
    { user: 'sarah', friend: 'emma_davis', status: 'online', mutualFriends: 12 },
    { user: 'sarah', friend: 'david_brown', status: 'offline', mutualFriends: 9 },
  ];

  if (friendshipsSeed.length) {
    await knex('friendships').insert(
      friendshipsSeed.map(item => ({
        user_id: userIdByUsername[item.user],
        friend_user_id: userIdByUsername[item.friend],
        status: item.status,
        mutual_friends: item.mutualFriends,
        created_at: hoursAgo(2),
      }))
    );
  }

  const friendSuggestionsSeed = [
    // Alex
    { user: 'alex', suggested: 'lisa_anderson', mutualFriends: 4 },
    { user: 'alex', suggested: 'james_wilson', mutualFriends: 6 },
    { user: 'alex', suggested: 'olivia_martinez', mutualFriends: 2 },
    { user: 'alex', suggested: 'ryan_taylor', mutualFriends: 9 },
    { user: 'alex', suggested: 'sophia_lee', mutualFriends: 5 },
    // Sarah
    { user: 'sarah', suggested: 'mike_williams', mutualFriends: 3 },
    { user: 'sarah', suggested: 'lisa_anderson', mutualFriends: 7 },
    { user: 'sarah', suggested: 'james_wilson', mutualFriends: 5 },
  ];

  if (friendSuggestionsSeed.length) {
    await knex('friend_suggestions').insert(
      friendSuggestionsSeed.map(item => ({
        user_id: userIdByUsername[item.user],
        suggested_user_id: userIdByUsername[item.suggested],
        mutual_friends: item.mutualFriends,
        created_at: hoursAgo(1),
      }))
    );
  }

  const friendRequestsSeed = [
    { sender: 'chris_miller', receiver: 'alex', mutualFriends: 3, sentAt: hoursAgo(2) },
    { sender: 'amanda_white', receiver: 'alex', mutualFriends: 7, sentAt: hoursAgo(5) },
    { sender: 'alex', receiver: 'benjamin_clark', mutualFriends: 4, sentAt: daysAgo(1) },
    { sender: 'natalie_kim', receiver: 'alex', mutualFriends: 2, sentAt: daysAgo(3) },
    { sender: 'alex', receiver: 'thomas_moore', mutualFriends: 6, sentAt: daysAgo(2) },
    { sender: 'ryan_taylor', receiver: 'sarah', mutualFriends: 4, sentAt: hoursAgo(1) },
    { sender: 'sarah', receiver: 'sophia_lee', mutualFriends: 6, sentAt: hoursAgo(12) },
  ];

  if (friendRequestsSeed.length) {
    await knex('friend_requests').insert(
      friendRequestsSeed.map(item => ({
        sender_user_id: userIdByUsername[item.sender],
        receiver_user_id: userIdByUsername[item.receiver],
        mutual_friends: item.mutualFriends,
        status: 'pending',
        created_at: item.sentAt,
      }))
    );
  }

  const postsSeed = [
    {
      key: 'p1',
      author: 'alex_johnson',
      text: 'Just finished a great workout! 💪',
      createdAt: hoursAgo(1),
      likedBy: ['sarah', 'mike_williams', 'emma_davis'],
      comments: [
        {
          key: 'c1',
          author: 'sarah_chen',
          text: 'Nice work!',
          createdAt: hoursAgo(0.5),
          likedBy: ['alex', 'mike_williams'],
        },
        {
          key: 'c2',
          author: 'mike_williams',
          text: 'Keep it up!',
          createdAt: hoursAgo(0.3),
          likedBy: ['sarah'],
        },
      ],
    },
    {
      key: 'p2',
      author: 'sarah_chen',
      text: 'Beautiful sunset today 🌅',
      createdAt: hoursAgo(3),
      likedBy: ['alex', 'emma_davis', 'david_brown'],
      comments: [
        {
          key: 'c3',
          author: 'emma_davis',
          text: 'Stunning!',
          createdAt: hoursAgo(2),
          likedBy: ['alex', 'sarah', 'david_brown', 'mike_williams', 'emma_davis'],
        },
      ],
    },
    {
      key: 'p3',
      author: 'emma_davis',
      text: 'New recipe turned out amazing! 🍰',
      createdAt: hoursAgo(5),
      likedBy: ['alex', 'sarah', 'david_brown'],
      comments: [],
    },
    {
      key: 'p4',
      author: 'sarah_chen',
      text: 'Exploring the city with friends 🏙️',
      createdAt: hoursAgo(2),
      likedBy: ['alex', 'emma_davis', 'david_brown'],
      comments: [
        {
          key: 'c4',
          author: 'emma_davis',
          text: 'So much fun!',
          createdAt: hoursAgo(1),
          likedBy: ['alex', 'sarah', 'david_brown', 'mike_williams', 'emma_davis'],
        },
        {
          key: 'c5',
          author: 'alex_johnson',
          text: 'Next time invite me!',
          createdAt: hoursAgo(0.5),
          likedBy: ['sarah', 'emma_davis', 'david_brown'],
        },
      ],
    },
    {
      key: 'p5',
      author: 'emma_davis',
      text: 'Weekend baking session 🍪',
      createdAt: hoursAgo(6),
      likedBy: ['alex', 'sarah', 'david_brown'],
      comments: [],
    },
  ];

  const postIdByKey = {};
  const commentIdByKey = {};

  for (const post of postsSeed) {
    const [postId] = await knex('posts').insert({
      user_id: userIdByUsername[post.author],
      text: post.text,
      created_at: post.createdAt,
    });

    postIdByKey[post.key] = postId;

    if (post.likedBy && post.likedBy.length) {
      await knex('post_likes').insert(
        post.likedBy.map(username => ({
          post_id: postId,
          user_id: userIdByUsername[username],
          created_at: hoursAgo(0.1),
        }))
      );
    }

    for (const comment of post.comments || []) {
      const [commentId] = await knex('comments').insert({
        post_id: postId,
        user_id: userIdByUsername[comment.author],
        text: comment.text,
        created_at: comment.createdAt,
      });

      commentIdByKey[comment.key] = commentId;

      if (comment.likedBy && comment.likedBy.length) {
        await knex('comment_likes').insert(
          comment.likedBy.map(username => ({
            comment_id: commentId,
            user_id: userIdByUsername[username],
            created_at: hoursAgo(0.05),
          }))
        );
      }
    }
  }
};

