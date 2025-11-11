"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

const API_URL = "/api/zakat-applicants"

export default function ApplicationStatusPage() {
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get("email") || ""

  const [email, setEmail] = useState(emailFromQuery)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Automatically call API if email is passed via URL
  useEffect(() => {
    if (emailFromQuery) {
      handleCheckStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailFromQuery])

  async function handleCheckStatus(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    setStatus(null)

    try {
      const res = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`)
      if (res.status === 404) {
        setError("You're not registered. Please apply first.")
        return
      }
      if (!res.ok) throw new Error("Failed to check status")
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        setStatus(data.items[0].status)
      } else {
        setError("You're not registered. Please apply first.")
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Check Your Application Status</h1>

        {!emailFromQuery && <p className="text-gray-600 mb-6">Enter your email to see your current status.</p>}

        {/* Show form only if email was not passed in URL */}
        {!emailFromQuery && (
          <form onSubmit={handleCheckStatus} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>
          </form>
        )}

        {/* Status messages */}
        {loading && <p className="mt-4 text-gray-500">Loading...</p>}
        {error && <p className="mt-4 text-red-500 font-medium">{error}</p>}
        {status && (
          <p className="mt-6 text-lg font-semibold text-teal-600">
            You're Application is <span className="text-gray-900">{status}</span>
          </p>
        )}
      </div>
    </div>
  )
}
