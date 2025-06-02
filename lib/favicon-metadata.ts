import { createAdminClient } from '@/lib/supabase-server'
import type { Metadata } from 'next'

/**
 * Loads favicon metadata from the database for server-side rendering
 * Returns metadata-compatible favicon links for Next.js App Router
 */
export async function getFaviconMetadata(): Promise<Partial<Metadata>> {
  try {
    const supabase = createAdminClient()

    // Get favicon settings from site_settings table
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .like('key', 'icon_%')

    if (error) {
      console.log('No custom favicons found, using defaults:', error)
      return {}
    }

    if (!data || data.length === 0) {
      console.log('No custom favicons found, using defaults')
      return {}
    }

    // Convert array of {key, value} to object
    const iconSettings: Record<string, string> = {}
    data.forEach((item) => {
      // Extract the filename part from the key (remove "icon_" prefix)
      const iconKey = item.key.replace('icon_', '')
      iconSettings[iconKey] = item.value
    })

    // Build favicon links array
    const icons: any[] = []

    // Basic favicons
    if (iconSettings['favicon_ico']) {
      icons.push({
        rel: 'shortcut icon',
        url: iconSettings['favicon_ico'],
      })
      icons.push({
        rel: 'icon',
        url: iconSettings['favicon_ico'],
      })
    }

    if (iconSettings['favicon_16x16_png']) {
      icons.push({
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: iconSettings['favicon_16x16_png'],
      })
    }

    if (iconSettings['favicon_32x32_png']) {
      icons.push({
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: iconSettings['favicon_32x32_png'],
      })
    }

    if (iconSettings['favicon_96x96_png']) {
      icons.push({
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        url: iconSettings['favicon_96x96_png'],
      })
    }

    // Apple touch icons
    if (iconSettings['apple_touch_icon_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        url: iconSettings['apple_touch_icon_png'],
      })
    }

    if (iconSettings['apple_icon_57x57_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        sizes: '57x57',
        url: iconSettings['apple_icon_57x57_png'],
      })
    }

    if (iconSettings['apple_icon_60x60_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        sizes: '60x60',
        url: iconSettings['apple_icon_60x60_png'],
      })
    }

    if (iconSettings['apple_icon_72x72_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        sizes: '72x72',
        url: iconSettings['apple_icon_72x72_png'],
      })
    }

    if (iconSettings['apple_icon_76x76_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        sizes: '76x76',
        url: iconSettings['apple_icon_76x76_png'],
      })
    }

    if (iconSettings['apple_icon_114x114_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        sizes: '114x114',
        url: iconSettings['apple_icon_114x114_png'],
      })
    }

    if (iconSettings['apple_icon_120x120_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        sizes: '120x120',
        url: iconSettings['apple_icon_120x120_png'],
      })
    }

    if (iconSettings['apple_icon_144x144_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        sizes: '144x144',
        url: iconSettings['apple_icon_144x144_png'],
      })
    }

    if (iconSettings['apple_icon_152x152_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        sizes: '152x152',
        url: iconSettings['apple_icon_152x152_png'],
      })
    }

    if (iconSettings['apple_icon_180x180_png']) {
      icons.push({
        rel: 'apple-touch-icon',
        sizes: '180x180',
        url: iconSettings['apple_icon_180x180_png'],
      })
    }

    // Android icons
    if (iconSettings['android_icon_192x192_png']) {
      icons.push({
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: iconSettings['android_icon_192x192_png'],
      })
    }

    return {
      icons: icons.length > 0 ? icons : undefined,
      other: buildOtherMetaTags(iconSettings),
    }
  } catch (err) {
    console.error('Error loading favicon metadata:', err)
    return {}
  }
}

/**
 * Build other meta tags for Microsoft tiles, etc.
 */
function buildOtherMetaTags(iconSettings: Record<string, string>): Record<string, string> {
  const metaTags: Record<string, string> = {}

  if (iconSettings['ms_icon_144x144_png']) {
    metaTags['msapplication-TileImage'] = iconSettings['ms_icon_144x144_png']
  }

  if (iconSettings['ms_icon_70x70_png']) {
    metaTags['msapplication-square70x70logo'] = iconSettings['ms_icon_70x70_png']
  }

  if (iconSettings['ms_icon_150x150_png']) {
    metaTags['msapplication-square150x150logo'] = iconSettings['ms_icon_150x150_png']
  }

  if (iconSettings['ms_icon_310x310_png']) {
    metaTags['msapplication-square310x310logo'] = iconSettings['ms_icon_310x310_png']
  }

  return metaTags
}