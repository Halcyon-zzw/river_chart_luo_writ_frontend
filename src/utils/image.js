import config from './config'

/**
 * Get full image URL, handling local file paths and remote URLs
 * @param {string} imageUrl - Image URL from backend
 * @returns {string} Full image URL
 */
export function getFullImageUrl(imageUrl) {
  if (!imageUrl) return ''

  // If already complete URL (http/https) or local file (file://), use directly
  if (imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('file://')) {
    return imageUrl
  }

  // If relative path, prepend API_BASE_URL
  if (imageUrl.startsWith('/')) {
    return config.API_BASE_URL + imageUrl
  }

  // Default: prepend API_BASE_URL
  return config.API_BASE_URL + '/' + imageUrl
}
