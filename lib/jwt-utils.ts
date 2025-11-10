import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export function generateToken(id: string): string {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "30d",
  })
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function decodeToken(token: string): any {
  return jwt.decode(token)
}
