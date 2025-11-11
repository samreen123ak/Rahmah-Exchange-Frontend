"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAuthToken, removeAuthToken, authenticatedFetch } from "@/lib/auth-utils"

// interface Document {
//   filename: string
//   originalname: string
//   mimeType: string
//   size: number
//   path: string
//   url: string
// }

interface Case {
  caseId: string
  firstName: string
  lastName: string
  requestType: string
  amountRequested: number | null
  status: string
  approvalDate?: string
  createdAt: string
  documents: Array<{
    filename: string
    originalname: string
    mimeType: string
    size: number
    url?: string
  }>
}

interface ApiResponse {
  items: Case[]
  total: number
  page: number
  limit: number
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Redirect if no token
  useEffect(() => {
    const token = getAuthToken()
    if (!token) router.push("/staff/login")
  }, [router])

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await authenticatedFetch(`/api/zakat-applicants`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!res.ok) throw new Error(`API error: ${res.status}`)

        const result: ApiResponse = await res.json()
        setCases(Array.isArray(result.items) ? result.items : [])
        setError(null)
      } catch (err) {
        console.error("Error fetching cases:", err)
        setError("Failed to load cases")
        setCases([])
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [])

  const handleLogout = () => {
    removeAuthToken()
    router.push("/staff/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/staff/dashboard" className="text-gray-600 hover:text-gray-900 font-medium transition">
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">All Cases</h2>
          <p className="text-gray-600">Manage and review all applicants</p>
        </div>

        {loading && <div className="bg-white rounded-lg p-12 text-center text-gray-600">Loading cases...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">{error}</div>}
        {!loading && !error && cases.length === 0 && (
          <div className="bg-white rounded-lg p-12 text-center text-gray-600">No cases found</div>
        )}

        {/* Cases Grid */}
        <div className="space-y-4">
          {cases.map((caseItem) => (
            <div
              key={caseItem.caseId}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md border border-gray-200 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {caseItem.firstName} {caseItem.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {caseItem.requestType} · ${caseItem.amountRequested || "N/A"}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ml-4 ${
                    caseItem.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : caseItem.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {caseItem.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-6 text-sm pt-4 border-t border-gray-100">
                <div>
                  <p className="text-gray-600">Case ID</p>
                  <p className="font-mono text-xs text-gray-900 mt-1">{caseItem.caseId.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-gray-600">Submitted</p>
                  <p className="text-gray-900 font-medium mt-1">{new Date(caseItem.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">{caseItem.status === "Approved" ? "Approved" : "Status"}</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {caseItem.approvalDate
                      ? new Date(caseItem.approvalDate).toLocaleDateString()
                      : new Date(caseItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <Link href={`/staff/cases/${caseItem.caseId}`}>
                    <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium">
                      Review
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
