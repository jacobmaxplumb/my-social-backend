function toRelativeTime(isoString) {
  if (!isoString) {
    return null;
  }

  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;

  if (Number.isNaN(diffMs)) {
    return null;
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${diffDays}d ago`;
}

module.exports = {
  toRelativeTime,
};

