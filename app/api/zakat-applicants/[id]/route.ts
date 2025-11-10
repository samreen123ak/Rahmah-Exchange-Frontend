import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import ZakatApplicant from "@/lib/models/ZakatApplicant"
import { authenticateRequest } from "@/lib/auth-middleware"

// GET by ID – public
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await dbConnect()
    const applicant = await ZakatApplicant.findById(id)
    if (!applicant) return NextResponse.json({ error: "Applicant not found" }, { status: 404 })
    return NextResponse.json(applicant)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT – requires auth
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await authenticateRequest(request)
    if (error) return NextResponse.json({ message: error }, { status: 401 })

    const body = await request.json()
    await dbConnect()

    // Prevent duplicate email
    if (body.email) {
      const existing = await ZakatApplicant.findOne({ email: body.email, _id: { $ne: id } })
      if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const updated = await ZakatApplicant.findByIdAndUpdate(id, body, { new: true, runValidators: true })
    if (!updated) return NextResponse.json({ error: "Applicant not found" }, { status: 404 })

    return NextResponse.json({ message: "Applicant updated successfully", applicant: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE – requires auth
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await authenticateRequest(request)
    if (error) return NextResponse.json({ message: error }, { status: 401 })

    await dbConnect()
    const deleted = await ZakatApplicant.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ error: "Applicant not found" }, { status: 404 })

    return NextResponse.json({ message: "Applicant deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
