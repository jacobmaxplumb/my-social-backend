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
      likedBy: ['sarah', 'mike_williams', 'emma_davis'], // Track userIds who liked
      comments: [
        { id: 'c1', username: 'sarah_chen', profileImage: '👩', text: 'Nice work!', timestamp: getTimestamp(0.5), likedBy: ['alex', 'mike_williams'] },
        { id: 'c2', username: 'mike_williams', profileImage: '👨', text: 'Keep it up!', timestamp: getTimestamp(0.3), likedBy: ['sarah'] },
      ],
    },
    {
      id: 'p2',
      username: 'sarah_chen',
      profileImage: '👩',
      timestamp: getTimestamp(3),
      text: 'Beautiful sunset today 🌅',
      likedBy: ['alex', 'emma_davis', 'david_brown'], // Track userIds who liked
      comments: [
        { id: 'c3', username: 'emma_davis', profileImage: '👩', text: 'Stunning!', timestamp: getTimestamp(2), likedBy: ['alex', 'sarah', 'david_brown', 'mike_williams', 'emma_davis'] },
      ],
    },
    {
      id: 'p3',
      username: 'emma_davis',
      profileImage: '👩',
      timestamp: getTimestamp(5),
      text: 'New recipe turned out amazing! 🍰',
      likedBy: ['alex', 'sarah', 'david_brown'], // Track userIds who liked
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
      likedBy: ['alex', 'emma_davis', 'david_brown'], // Track userIds who liked
      comments: [
        { id: 'c4', username: 'emma_davis', profileImage: '👩', text: 'Stunning!', timestamp: getTimestamp(1), likedBy: ['alex', 'sarah', 'david_brown', 'mike_williams', 'emma_davis'] },
        { id: 'c5', username: 'alex_johnson', profileImage: '👨', text: 'Amazing!', timestamp: getTimestamp(0.5), likedBy: ['sarah', 'emma_davis', 'david_brown'] },
      ],
    },
    {
      id: 'p5',
      username: 'emma_davis',
      profileImage: '👩',
      timestamp: getTimestamp(6),
      text: 'New recipe turned out amazing! 🍰',
      likedBy: ['alex', 'sarah', 'david_brown'], // Track userIds who liked
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
  if (!userDataStore[userId]) {
    userDataStore[userId] = {
      friends: [],
      suggestions: [],
      requests: [],
      posts: [],
    };
  }
  return userDataStore[userId];
}

/**
 * Get user profile info (for creating posts/comments)
 * In a real app, this would come from a user database
 */
function getUserProfile(userId) {
  // Mock profile data - in production, fetch from user database
  const profiles = {
    alex: { username: 'alex', profileImage: '👨' },
    sarah: { username: 'sarah', profileImage: '👩' },
  };
  return profiles[userId] || { username: userId, profileImage: '👤' };
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
 * Add relativeTimestamp to posts and comments, and compute likes count
 * Also adds likedByCurrentUser flag if userId is provided
 */
function enrichPosts(posts, currentUserId = null) {
  return posts.map(post => {
    const likedBy = post.likedBy || [];
    const isLiked = currentUserId ? likedBy.includes(currentUserId) : false;
    
    return {
      ...post,
      relativeTimestamp: getRelativeTimestamp(post.timestamp),
      likes: likedBy.length,
      likedByCurrentUser: isLiked,
      comments: post.comments.map(comment => {
        const commentLikedBy = comment.likedBy || [];
        const commentIsLiked = currentUserId ? commentLikedBy.includes(currentUserId) : false;
        
        return {
          ...comment,
          relativeTimestamp: getRelativeTimestamp(comment.timestamp),
          likes: commentLikedBy.length,
          likedByCurrentUser: commentIsLiked,
        };
      }),
    };
  });
}

/**
 * Create a new post for a user
 */
function createPost(userId, text) {
  const userData = getUserData(userId);
  const profile = getUserProfile(userId);
  
  const newPost = {
    id: `p${Date.now()}`,
    username: profile.username,
    profileImage: profile.profileImage,
    timestamp: new Date().toISOString(),
    text,
    likedBy: [], // Track userIds who liked
    comments: [],
  };
  
  userData.posts.unshift(newPost); // Add to beginning
  return newPost;
}

/**
 * Add a comment to a post
 */
function addComment(userId, postId, text) {
  const userData = getUserData(userId);
  const profile = getUserProfile(userId);
  
  // Find the post in user's feed
  const post = userData.posts.find(p => p.id === postId);
  if (!post) {
    return null;
  }
  
  const newComment = {
    id: `c${Date.now()}`,
    username: profile.username,
    profileImage: profile.profileImage,
    text,
    timestamp: new Date().toISOString(),
    likedBy: [], // Track userIds who liked
  };
  
  post.comments.push(newComment);
  return newComment;
}

/**
 * Send a friend request
 */
function sendFriendRequest(fromUserId, toUsername) {
  const fromUserData = getUserData(fromUserId);
  const fromProfile = getUserProfile(fromUserId);
  
  // Check if already friends
  const isAlreadyFriend = fromUserData.friends.some(f => f.username === toUsername);
  if (isAlreadyFriend) {
    return { error: 'already_friends' };
  }
  
  // Check if request already exists
  const existingRequest = fromUserData.requests.find(
    r => r.username === toUsername && r.type === 'outgoing'
  );
  if (existingRequest) {
    return { error: 'request_already_sent' };
  }
  
  // Create outgoing request
  const newRequest = {
    id: `r${Date.now()}`,
    username: toUsername,
    profileImage: '👤', // Mock - in production, fetch from user database
    mutualFriends: 0,
    type: 'outgoing',
    sentAt: new Date().toISOString(),
  };
  
  fromUserData.requests.push(newRequest);
  
  // Also add as incoming request for the target user (if they exist in our mock data)
  const toUserData = getUserData(toUsername);
  const incomingRequest = {
    id: `r${Date.now()}_incoming`,
    username: fromProfile.username,
    profileImage: fromProfile.profileImage,
    mutualFriends: 0,
    type: 'incoming',
    sentAt: new Date().toISOString(),
  };
  toUserData.requests.push(incomingRequest);
  
  return newRequest;
}

/**
 * Toggle like on a post (like if not liked, unlike if already liked)
 * Returns { liked: boolean, likes: number } indicating new state
 */
function togglePostLike(userId, postId) {
  const userData = getUserData(userId);
  const post = userData.posts.find(p => p.id === postId);
  
  if (!post) {
    return null;
  }
  
  if (!post.likedBy) {
    post.likedBy = [];
  }
  
  const index = post.likedBy.indexOf(userId);
  let liked;
  
  if (index > -1) {
    // Unlike - remove from array
    post.likedBy.splice(index, 1);
    liked = false;
  } else {
    // Like - add to array
    post.likedBy.push(userId);
    liked = true;
  }
  
  return {
    liked,
    likes: post.likedBy.length,
  };
}

/**
 * Toggle like on a comment (like if not liked, unlike if already liked)
 * Returns { liked: boolean, likes: number } indicating new state
 */
function toggleCommentLike(userId, postId, commentId) {
  const userData = getUserData(userId);
  const post = userData.posts.find(p => p.id === postId);
  
  if (!post) {
    return null;
  }
  
  const comment = post.comments.find(c => c.id === commentId);
  if (!comment) {
    return null;
  }
  
  if (!comment.likedBy) {
    comment.likedBy = [];
  }
  
  const index = comment.likedBy.indexOf(userId);
  let liked;
  
  if (index > -1) {
    // Unlike - remove from array
    comment.likedBy.splice(index, 1);
    liked = false;
  } else {
    // Like - add to array
    comment.likedBy.push(userId);
    liked = true;
  }
  
  return {
    liked,
    likes: comment.likedBy.length,
  };
}

module.exports = {
  getUserData,
  getUserProfile,
  enrichRequests,
  enrichPosts,
  createPost,
  addComment,
  sendFriendRequest,
  getRelativeTimestamp,
  togglePostLike,
  toggleCommentLike,
};

