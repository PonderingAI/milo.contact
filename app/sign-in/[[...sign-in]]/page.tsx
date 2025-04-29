import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-gray-900 border border-gray-800",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white",
            socialButtonsBlockButtonText: "text-white font-normal",
            dividerLine: "bg-gray-700",
            dividerText: "text-gray-400",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-gray-800 border-gray-700 text-white",
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
            footerActionLink: "text-blue-400 hover:text-blue-300",
            identityPreviewText: "text-gray-300",
            identityPreviewEditButton: "text-blue-400 hover:text-blue-300",
          },
        }}
        redirectUrl="/admin"
      />
    </div>
  )
}
