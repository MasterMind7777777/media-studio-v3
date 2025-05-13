
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a URL points to an image file
 * @param url The URL to check
 * @returns True if the URL is likely an image
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for common image file extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
  const lowercaseUrl = url.toLowerCase();
  
  // Check if URL ends with an image extension
  const hasImageExtension = imageExtensions.some(ext => lowercaseUrl.endsWith(ext));
  
  // Check for image content type in URL (common in CDNs and APIs)
  const hasImageContentType = lowercaseUrl.includes('image/');
  
  return hasImageExtension || hasImageContentType;
}

/**
 * Check if a URL points to an audio file
 * @param url The URL to check
 * @returns True if the URL is likely an audio file
 */
export function isAudioUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for common audio file extensions
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac'];
  const lowercaseUrl = url.toLowerCase();
  
  // Check if URL ends with an audio extension
  const hasAudioExtension = audioExtensions.some(ext => lowercaseUrl.endsWith(ext));
  
  // Check for audio content type in URL
  const hasAudioContentType = lowercaseUrl.includes('audio/');
  
  return hasAudioExtension || hasAudioContentType;
}

/**
 * Check if a URL points to a video file
 * @param url The URL to check
 * @returns True if the URL is likely a video
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for common video file extensions
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  const lowercaseUrl = url.toLowerCase();
  
  // Check if URL ends with a video extension
  const hasVideoExtension = videoExtensions.some(ext => lowercaseUrl.endsWith(ext));
  
  // Check for video content type in URL
  const hasVideoContentType = lowercaseUrl.includes('video/');
  
  return hasVideoExtension || hasVideoContentType;
}
