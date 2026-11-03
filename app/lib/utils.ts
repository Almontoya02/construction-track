import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a proxied URL for external images to avoid CORS issues
 * @param imageUrl - The original image URL to proxy
 * @returns Proxied URL or original URL if not a Google image
 */
export function getProxiedAvatarUrl(
  imageUrl: string | null | undefined,
): string | undefined {
  if (!imageUrl) return undefined;

  // Only proxy Google profile images
  if (imageUrl.startsWith("https://lh3.googleusercontent.com/")) {
    return `/api/avatar?url=${encodeURIComponent(imageUrl)}`;
  }

  return imageUrl;
}
