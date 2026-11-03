import type { Route } from "./+types/api.avatar";
import logger from "@/lib/logger.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    throw new Response("Missing URL parameter", { status: 400 });
  }

  // Validate that it's a Google profile image URL for security
  if (!imageUrl.startsWith("https://lh3.googleusercontent.com/")) {
    throw new Response("Invalid image URL", { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
        Referer: "https://accounts.google.com/",
      },
    });

    if (!response.ok) {
      throw new Response("Failed to fetch image", { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    logger.error(error, "Error proxying image:");
    throw new Response("Internal Server Error", { status: 500 });
  }
}
