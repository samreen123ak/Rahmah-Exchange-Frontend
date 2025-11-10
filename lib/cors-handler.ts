import { NextResponse } from "next/server"

export function addCorsHeaders(response: Response) {
  const headers = new Headers(response.headers)
  headers.set("Access-Control-Allow-Origin", "*")
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function handleCorsOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
