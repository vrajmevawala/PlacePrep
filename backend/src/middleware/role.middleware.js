// This middleware is deprecated - use authMiddleware instead
// Keeping for backward compatibility but it should be replaced
export const checkAuthority = (req, res, next) => {
    // This duplicates authMiddleware logic - should be removed
    // For now, just pass through if user is already authenticated
    if (req.user) {
        return next();
    }
    return res.status(401).json({ message: 'Not authorized, no token' });
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: Insufficient role' });
  }
  next();
};

export const requireAdmin = requireRole('admin');
export const requireModerator = requireRole('moderator');
export const requireAdminOrModerator = requireRole('admin', 'moderator');