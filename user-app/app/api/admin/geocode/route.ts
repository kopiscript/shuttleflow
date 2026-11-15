// app/api/admin/geocode/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address || address.trim().length < 3) {
      return NextResponse.json(
        { error: "Address must be at least 3 characters" },
        { status: 400 }
      );
    }

    const apiKey = process.env.TOMTOM_API_KEY;
    if (!apiKey) {
      console.error("❌ TOMTOM_API_KEY is missing from .env.local");
      return NextResponse.json(
        { error: "Geocoding service not configured (missing API key)" },
        { status: 500 }
      );
    }

    const url = new URL(
      `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(
        address.trim()
      )}.json`
    );
    url.searchParams.set("key", apiKey);
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrySet", "MY");

    // 1. Add a timeout so it doesn't hang for 10 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(url.toString(), {
      cache: "no-store",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ TomTom API Error (${res.status}):`, errorText);
      return NextResponse.json(
        { error: `Geocoding failed: TomTom returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const result = data?.results?.[0];

    if (!result) {
      return NextResponse.json(
        { error: "No results found for that address" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lat: result.position.lat,
      lng: result.position.lon,
      formattedAddress: result.address?.freeformAddress ?? address,
    });
  } catch (error: any) {
    // 2. Catch network errors, AbortErrors, and JSON parse errors
    console.error("❌ Geocode Route Exception:", error);
    
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Geocoding request timed out. Check your internet connection." },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}