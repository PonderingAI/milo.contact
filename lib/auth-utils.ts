import { cookies } from "next/headers"

export async function isAdmin() {
  const adminCookie = cookies().get("admin")
  const isAdmin = adminCookie?.value === "true"

  return { isAdmin }
}
