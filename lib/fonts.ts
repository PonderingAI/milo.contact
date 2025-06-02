// Replaced Google Fonts with system font fallbacks due to firewall restrictions  
// import { Inter, Playfair_Display } from "next/font/google"

// System font configurations using CSS font stacks
export const fontSans = {
  style: { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  variable: "--font-sans",
}

export const fontSerif = {
  style: { fontFamily: 'Georgia, "Times New Roman", Times, serif' },
  variable: "--font-serif",
}
