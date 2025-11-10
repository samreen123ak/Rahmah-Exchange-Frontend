import type { NextRequest } from "next/server"
import { dbConnect } from "./db"
import BlacklistedToken from "./models/BlacklistedToken"
import User from "./models/User"
import { verifyToken } from "./jwt-utils"

export async function authenticateRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "No token provided" }
    }

    const token = authHeader.substring(7)

    // Check if token is blacklisted
    await dbConnect()
    const blacklistedToken = await BlacklistedToken.findOne({ token })
    if (blacklistedToken) {
      return { user: null, error: "Token is blacklisted" }
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return { user: null, error: "Invalid or expired token" }
    }

    // Get user from database
    const user = await User.findById(decoded.id)
    if (!user) {
      return { user: null, error: "User not found" }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: "Authentication failed" }
  }
}
