import jwt from 'jsonwebtoken'

export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    req.user = {
      _id: decoded._id,
      email: decoded.email,
      name: decoded.name
    }

    next()
  } catch (err) {
    return res.status(403).json({ message: 'Forbidden: Invalid or expired token' })
  }
}