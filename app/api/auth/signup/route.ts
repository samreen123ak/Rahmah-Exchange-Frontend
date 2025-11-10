import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import User from "@/lib/models/User"
import { generateToken } from "@/lib/jwt-utils"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields required" }, { status: 400 })
    }

    await dbConnect()

    // Check if user exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Create user
    const user = await User.create({ name, email, password })

    return NextResponse.json(
      {
        message: "Signup successful",
        token: generateToken(user._id.toString()),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
