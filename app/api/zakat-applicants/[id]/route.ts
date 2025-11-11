import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import ZakatApplicant from "@/lib/models/ZakatApplicant"
import Notification from "@/lib/models/Notification"
import Grant from "@/lib/models/Grant"
import { authenticateRequest } from "@/lib/auth-middleware"
import { sendEmail, getAdminEmail } from "@/lib/email"

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

    if (body.status === "Approved") {
      body.approvalDate = new Date()
    }

    const updated = await ZakatApplicant.findByIdAndUpdate(id, body, { new: true, runValidators: true })
    if (!updated) return NextResponse.json({ error: "Applicant not found" }, { status: 404 })

    if (body.status && body.status !== "Pending" && updated.email) {
      const grant = await Grant.findOne({ applicantId: id })
      const grantedAmount = grant?.grantedAmount || 0

      const subject =
        body.status === "Approved" ? "Your Application Has Been Approved!" : "Update on Your Application Status"

      const emailContent =
        body.status === "Approved"
          ? `
          <h2>Congratulations!</h2>
          <p>Dear ${updated.firstName} ${updated.lastName},</p>
          <p>We are pleased to inform you that your application for assistance has been <strong>APPROVED</strong>!</p>
          <p><strong>Approval Date:</strong> ${new Date(updated.approvalDate).toLocaleDateString()}</p>
          ${grantedAmount > 0 ? `<p><strong>Granted Amount:</strong> $${grantedAmount.toLocaleString()}</p>` : ""}
          <p>You will receive further instructions about the disbursement process.</p>
          <p>Thank you for your patience.</p>
          <p>Best regards,<br/>Rahmah Exchange Team</p>
        `
          : `
          <h2>Application Status Update</h2>
          <p>Dear ${updated.firstName} ${updated.lastName},</p>
          <p>We regret to inform you that your application for assistance has been <strong>REJECTED</strong>.</p>
          <p>If you believe this is an error or would like to appeal this decision, please contact our support team.</p>
          <p>We appreciate your understanding.</p>
          <p>Best regards,<br/>Rahmah Exchange Team</p>
        `

      await sendEmail({
        to: updated.email,
        subject,
        html: emailContent,
      })

      const adminEmail = getAdminEmail()
      if (adminEmail) {
        const adminEmailContent = `
          <h2>Application Status Change Notification</h2>
          <p><strong>Applicant:</strong> ${updated.firstName} ${updated.lastName}</p>
          <p><strong>Application ID:</strong> ${updated.caseId}</p>
          <p><strong>New Status:</strong> ${body.status}</p>
          ${grantedAmount > 0 ? `<p><strong>Granted Amount:</strong> $${grantedAmount.toLocaleString()}</p>` : ""}
          <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p>This is a system notification.</p>
        `

        await sendEmail({
          to: adminEmail,
          subject: `Application ${body.status}: ${updated.firstName} ${updated.lastName}`,
          html: adminEmailContent,
        })
      }

      const notificationData = {
        applicantId: updated._id,
        type: body.status.toLowerCase(),
        title: subject,
        message: `Your application status has been updated to ${body.status}`,
        grantedAmount,
        approvalDate: updated.approvalDate,
      }

      await Notification.create(notificationData)
    }

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

    await Grant.deleteMany({ applicantId: id })
    await Notification.deleteMany({ applicantId: id })

    const deleted = await ZakatApplicant.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ error: "Applicant not found" }, { status: 404 })

    return NextResponse.json({ message: "Applicant deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
