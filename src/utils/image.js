import config from './config'

/**
 * Get full image URL, handling local file paths and remote URLs
 * @param {string} imageUrl - Image URL from backend
 * @returns {string} Full image URL
 */
export function getFullImageUrl(imageUrl) {
  if (!imageUrl) return ''

  // If already complete URL (http/https), use directly
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // Handle file:// protocol - convert server file path to HTTP URL
  if (imageUrl.startsWith('file://')) {
    // Extract path after file://
    // Example: file:///Users/zhuzhiwei/tmp/uploads/2026/01/04/xxx.jpg
    // Need to convert to: http://localhost:8080/uploads/2026/01/04/xxx.jpg

    // Remove file:// prefix
    const filePath = imageUrl.replace('file://', '')

    // Check if it contains /uploads/ (server upload directory)
    const uploadsIndex = filePath.indexOf('/uploads/')
    if (uploadsIndex !== -1) {
      // Extract from /uploads/ onwards
      const relativePath = filePath.substring(uploadsIndex)
      return config.API_BASE_URL + relativePath
    }

    // If it's a real local file (like wxfile:// in WeChat), return as-is
    // This shouldn't happen with file:/// from backend, but keep for safety
    return imageUrl
  }

  // If relative path, prepend API_BASE_URL
  if (imageUrl.startsWith('/')) {
    return config.API_BASE_URL + imageUrl
  }

  // Default: prepend API_BASE_URL
  return config.API_BASE_URL + '/' + imageUrl
}
