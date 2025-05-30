import type { Metadata } from "next"
import DatabasePage from "./client-page"

export const metadata: Metadata = {
  title: "Database Management",
  description: "Manage database tables and schema",
}

export default function Page() {
  return <DatabasePage />
}
