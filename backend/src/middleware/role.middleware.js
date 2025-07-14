import jwt from 'jsonwebtoken';

export const checkAuthority = (req, res, next) => {
    const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.userID, role: decoded.role };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
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