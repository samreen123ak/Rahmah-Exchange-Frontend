import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const { filename } = await params
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    const filePath = path.join(uploadsDir, filename)

    // Security: Ensure file is within uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 })
    }

    const fileBuffer = await readFile(filePath)
    const ext = filename.split(".").pop()?.toLowerCase()

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    const contentType = mimeTypes[ext || ""] || "application/octet-stream"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("Document fetch error:", error)
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }
}
