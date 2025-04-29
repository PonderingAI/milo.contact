import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            card: "bg-gray-900 text-white",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-300",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-gray-800 text-white border-gray-700",
            footerActionLink: "text-blue-400 hover:text-blue-500",
          },
        }}
      />
    </div>
  )
}
