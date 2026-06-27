"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setStatus("error")
      setMessage("No verification token provided")
      return
    }
    api.auth.verifyEmail(token).then((res) => {
      setStatus("success")
      setMessage(res.message)
    }).catch((err) => {
      setStatus("error")
      setMessage(err.message || "Verification failed")
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>
            {status === "verifying" && "Verifying..."}
            {status === "success" && "Email Verified! ✅"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {status === "success" && <Button onClick={() => router.push("/login")}>Go to Login</Button>}
          {status === "error" && <Button variant="outline" onClick={() => router.push("/login")}>Back to Login</Button>}
        </CardContent>
      </Card>
    </div>
  )
}
