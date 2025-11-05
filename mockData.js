/**
 * Mock data store scoped by userId
 * Each user has their own set of friends, suggestions, requests, and posts
 */

// Convert relative time strings to ISO 8601 timestamps
function getTimestamp(hoursAgo = 0) {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
}

function getRelativeTimestamp(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

// Mock data for user 'alex'
const alexData = {
  friends: [
    { id: 'f1', username: 'alex_johnson', profileImage: '👨', status: 'online', mutualFriends: 5 },
    { id: 'f2', username: 'sarah_chen', profileImage: '👩', status: 'online', mutualFriends: 8 },
    { id: 'f3', username: 'mike_williams', profileImage: '👨', status: 'offline', mutualFriends: 3 },
    { id: 'f4', username: 'emma_davis', profileImage: '👩', status: 'online', mutualFriends: 12 },
    { id: 'f5', username: 'david_brown', profileImage: '👨', status: 'offline', mutualFriends: 7 },
  ],
  suggestions: [
    { id: 's1', username: 'lisa_anderson', profileImage: '👩', mutualFriends: 4 },
    { id: 's2', username: 'james_wilson', profileImage: '👨', mutualFriends: 6 },
    { id: 's3', username: 'olivia_martinez', profileImage: '👩', mutualFriends: 2 },
    { id: 's4', username: 'ryan_taylor', profileImage: '👨', mutualFriends: 9 },
    { id: 's5', username: 'sophia_lee', profileImage: '👩', mutualFriends: 5 },
  ],
  requests: [
    { id: 'r1', username: 'chris_miller', profileImage: '👨', mutualFriends: 3, type: 'incoming', sentAt: getTimestamp(2) },
    { id: 'r2', username: 'amanda_white', profileImage: '👩', mutualFriends: 7, type: 'incoming', sentAt: getTimestamp(5) },
    { id: 'r3', username: 'benjamin_clark', profileImage: '👨', mutualFriends: 4, type: 'outgoing', sentAt: getTimestamp(24) },
    { id: 'r4', username: 'natalie_kim', profileImage: '👩', mutualFriends: 2, type: 'incoming', sentAt: getTimestamp(72) },
    { id: 'r5', username: 'thomas_moore', profileImage: '👨', mutualFriends: 6, type: 'outgoing', sentAt: getTimestamp(48) },
  ],
  posts: [
    {
      id: 'p1',
      username: 'alex_johnson',
      profileImage: '👨',
      timestamp: getTimestamp(1),
      text: 'Just finished a great workout! 💪',
      likes: 12,
      comments: [
        { id: 'c1', username: 'sarah_chen', profileImage: '👩', text: 'Nice work!', timestamp: getTimestamp(0.5), likes: 2 },
        { id: 'c2', username: 'mike_williams', profileImage: '👨', text: 'Keep it up!', timestamp: getTimestamp(0.3), likes: 1 },
      ],
    },
    {
      id: 'p2',
      username: 'sarah_chen',
      profileImage: '👩',
      timestamp: getTimestamp(3),
      text: 'Beautiful sunset today 🌅',
      likes: 28,
      comments: [
        { id: 'c3', username: 'emma_davis', profileImage: '👩', text: 'Stunning!', timestamp: getTimestamp(2), likes: 5 },
      ],
    },
    {
      id: 'p3',
      username: 'emma_davis',
      profileImage: '👩',
      timestamp: getTimestamp(5),
      text: 'New recipe turned out amazing! 🍰',
      likes: 15,
      comments: [],
    },
  ],
};

// Mock data for user 'sarah'
const sarahData = {
  friends: [
    { id: 'f6', username: 'alex_johnson', profileImage: '👨', status: 'online', mutualFriends: 8 },
    { id: 'f7', username: 'emma_davis', profileImage: '👩', status: 'online', mutualFriends: 12 },
    { id: 'f8', username: 'david_brown', profileImage: '👨', status: 'offline', mutualFriends: 9 },
  ],
  suggestions: [
    { id: 's6', username: 'mike_williams', profileImage: '👨', mutualFriends: 3 },
    { id: 's7', username: 'lisa_anderson', profileImage: '👩', mutualFriends: 7 },
    { id: 's8', username: 'james_wilson', profileImage: '👨', mutualFriends: 5 },
  ],
  requests: [
    { id: 'r6', username: 'ryan_taylor', profileImage: '👨', mutualFriends: 4, type: 'incoming', sentAt: getTimestamp(1) },
    { id: 'r7', username: 'sophia_lee', profileImage: '👩', mutualFriends: 6, type: 'outgoing', sentAt: getTimestamp(12) },
  ],
  posts: [
    {
      id: 'p4',
      username: 'sarah_chen',
      profileImage: '👩',
      timestamp: getTimestamp(2),
      text: 'Beautiful sunset today 🌅',
      likes: 28,
      comments: [
        { id: 'c4', username: 'emma_davis', profileImage: '👩', text: 'Stunning!', timestamp: getTimestamp(1), likes: 5 },
        { id: 'c5', username: 'alex_johnson', profileImage: '👨', text: 'Amazing!', timestamp: getTimestamp(0.5), likes: 3 },
      ],
    },
    {
      id: 'p5',
      username: 'emma_davis',
      profileImage: '👩',
      timestamp: getTimestamp(6),
      text: 'New recipe turned out amazing! 🍰',
      likes: 15,
      comments: [],
    },
  ],
};

// In-memory user data store
const userDataStore = {
  alex: alexData,
  sarah: sarahData,
};

/**
 * Get user data by userId
 */
function getUserData(userId) {
  return userDataStore[userId] || {
    friends: [],
    suggestions: [],
    requests: [],
    posts: [],
  };
}

/**
 * Add relativeTimestamp to requests
 */
function enrichRequests(requests) {
  return requests.map(req => ({
    ...req,
    relativeTimestamp: getRelativeTimestamp(req.sentAt),
  }));
}

/**
 * Add relativeTimestamp to posts and comments
 */
function enrichPosts(posts) {
  return posts.map(post => ({
    ...post,
    relativeTimestamp: getRelativeTimestamp(post.timestamp),
    comments: post.comments.map(comment => ({
      ...comment,
      relativeTimestamp: getRelativeTimestamp(comment.timestamp),
    })),
  }));
}

module.exports = {
  getUserData,
  enrichRequests,
  enrichPosts,
};

