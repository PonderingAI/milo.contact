import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import type { MetadataRoute } from "next";

// Define default values, potentially from a config file or environment variables
const DEFAULT_APP_NAME = "Milo Presedo Portfolio";
const DEFAULT_SHORT_NAME = "Milo Portfolio";
const DEFAULT_DESCRIPTION = "Portfolio of Milo Presedo, Director of Photography, Camera Assistant, Drone & Underwater Operator";
const DEFAULT_BACKGROUND_COLOR = "#000000";
const DEFAULT_THEME_COLOR = "#000000";
const DEFAULT_FAVICON_ICO = "/favicon.ico"; // Fallback path
const DEFAULT_ANDROID_ICON_192 = "/android-chrome-192x192.png"; // Fallback path
const DEFAULT_ANDROID_ICON_512 = "/android-chrome-512x512.png"; // Fallback path


export async function GET(_req: NextRequest) {
  let faviconSrc = DEFAULT_FAVICON_ICO;
  let androidIcon192Src = DEFAULT_ANDROID_ICON_192;
  let androidIcon512Src = DEFAULT_ANDROID_ICON_512;
  let appName = DEFAULT_APP_NAME;
  let shortName = DEFAULT_SHORT_NAME;
  let description = DEFAULT_DESCRIPTION;
  let backgroundColor = DEFAULT_BACKGROUND_COLOR;
  let themeColor = DEFAULT_THEME_COLOR;

  // Only try to fetch from database if environment variables are available
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createAdminClient();

      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'icon_favicon_ico', 
          'icon_android_icon_192x192_png', 
          'icon_android_icon_512x512_png', // Assuming a 512x512 icon might be uploaded
          'site_name',
          'site_short_name',
          'site_description',
          'site_theme_color',
          'site_background_color'
        ]);

      if (error) {
        console.error("Error fetching site settings for manifest:", error.message);
        // Proceed with defaults if there's an error
      }

      if (settings) {
        const settingsMap = new Map(settings.map(s => [s.key, s.value]));
        faviconSrc = settingsMap.get('icon_favicon_ico') || DEFAULT_FAVICON_ICO;
        androidIcon192Src = settingsMap.get('icon_android_icon_192x192_png') || DEFAULT_ANDROID_ICON_192;
        androidIcon512Src = settingsMap.get('icon_android_icon_512x512_png') || DEFAULT_ANDROID_ICON_512; // Use if available
        
        appName = settingsMap.get('site_name') || DEFAULT_APP_NAME;
        shortName = settingsMap.get('site_short_name') || DEFAULT_SHORT_NAME;
        description = settingsMap.get('site_description') || DEFAULT_DESCRIPTION;
        themeColor = settingsMap.get('site_theme_color') || DEFAULT_THEME_COLOR;
        backgroundColor = settingsMap.get('site_background_color') || DEFAULT_BACKGROUND_COLOR;
      }
    } catch (e: any) {
      console.error("Unexpected error fetching site settings for manifest:", e.message);
      // Proceed with defaults
    }
  } else {
    console.warn("Supabase environment variables not available, using default manifest values");
  }

  const manifestContent: MetadataRoute.Manifest = {
    name: appName,
    short_name: shortName,
    description: description,
    start_url: "/",
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    icons: [
      {
        src: faviconSrc,
        sizes: "any", // .ico can contain multiple sizes
        type: "image/x-icon",
      },
      {
        src: androidIcon192Src,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: androidIcon512Src, // Adding a 512x512 icon for better PWA support
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };

  return new Response(JSON.stringify(manifestContent), {
    headers: { 
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
