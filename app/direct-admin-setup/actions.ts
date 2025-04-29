"use server"

export async function verifyBootstrapSecret(secret: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get the bootstrap secret from environment
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET

    if (!bootstrapSecret) {
      return {
        success: false,
        message: "Bootstrap secret not configured on the server",
      }
    }

    // Check if the entered secret matches
    if (secret !== bootstrapSecret) {
      return {
        success: false,
        message: "Invalid bootstrap secret",
      }
    }

    return {
      success: true,
      message: "Secret verified successfully",
    }
  } catch (error) {
    console.error("Error verifying bootstrap secret:", error)
    return {
      success: false,
      message: "An error occurred while verifying the secret",
    }
  }
}
