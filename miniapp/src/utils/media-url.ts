const PLACEHOLDER_HOSTS = new Set(['example.com', 'api.example.com'])

function isLocalImageUrl(url: string) {
  return url.startsWith('wxfile://') || url.startsWith('http://tmp/') || url.startsWith('data:image/')
}

export function isUsableImageUrl(url?: string | null) {
  const normalized = url?.trim()
  if (!normalized) {
    return false
  }

  if (isLocalImageUrl(normalized)) {
    return true
  }

  try {
    const parsed = new URL(normalized)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    if (PLACEHOLDER_HOSTS.has(parsed.hostname)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export function getSafeImageUrl(url?: string | null, fallback = '') {
  return isUsableImageUrl(url) ? String(url).trim() : fallback
}
