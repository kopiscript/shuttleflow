import { NextResponse } from "next/server";

// Mock bus locations (replace with database data later)
const mockBusLocations = [
  { id: 1, name: "Bus B001", lat: 3.0742, lng: 101.5438, routeId: 2, status: "active" },
  { id: 2, name: "Bus B002", lat: 2.9289, lng: 101.7778, routeId: 3, status: "active" },
];

export async function GET() {
  return NextResponse.json({ success: true, buses: mockBusLocations });
}