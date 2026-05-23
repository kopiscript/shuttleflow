// app/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

export default function HomePage() {
  const [selectedRoute, setSelectedRoute] = useState("");

  return (
    <div className="relative flex flex-col min-h-screen bg-[#EEEBE4] overflow-x-hidden">
      {/* Gradient Background Elements - Exact Figma Positions */}
      
      {/* First gradient: Top Left - moved further left */}
      <div 
        className="absolute w-[569px] h-[414px] top-[-106px] bg-[#99121A] blur-[100px] opacity-50"
        style={{ 
          left: "calc(50% - 568.85px/2 - 280px)",
          transform: "matrix(-1, 0.03, 0.03, 1, 0, 0)"
        }}
      />
      
      {/* Second gradient: Right Top to Middle */}
      <div 
        className="absolute w-[604px] h-[871px] top-[-322px] bg-[#CF2B10] opacity-30 blur-[150px]"
        style={{ 
          left: "calc(50% - 604px/2 + 31.5px)",
          transform: "matrix(-0.93, 0.37, 0.37, 0.93, 0, 0)"
        }}
      />

      {/* Header */}
      <div className="relative z-10 px-6 pt-5 flex-shrink-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          {/* Hamburger Menu */}
          <button className="w-5 h-5 flex flex-col justify-between">
            <span className="block w-5 h-[2px] bg-white rounded-full" />
            <span className="block w-5 h-[2px] bg-white rounded-full" />
            <span className="block w-5 h-[2px] bg-white rounded-full" />
          </button>

          {/* Logo */}
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={148} 
            height={34} 
            className="object-contain"
          />

          {/* Bell Notification Icon */}
          <button className="w-7 h-7 relative">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <h1 className="text-center text-white text-2xl font-bold mt-6">
          Track your Bus
        </h1>

        {/* Description */}
        <p className="text-center text-white text-base font-medium mt-2 px-4">
          Choose a route to track the bus live on the map and view its estimated arrival time instantly.
        </p>
      </div>

      {/* Map Section - fills remaining space */}
      <div className="relative flex-1 mt-4">
        {/* Map Placeholder - fills entire container */}
        <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500">
          Map Placeholder (Leaflet will go here)
        </div>

        {/* Floating Route Dropdown (top of map) */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-10">
          <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between">
            <span className="text-gray-400 text-sm">Select route</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Floating ETA Card (bottom of screen) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-10">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            {/* ETA */}
            <div className="flex items-center gap-2">
              <span className="text-gray-800 font-semibold text-sm">ETA: 9:03 AM</span>
            </div>
            {/* Disclaimer with Star Icon */}
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-4 h-4 text-[#99121A]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-gray-500 text-xs">Disclaimer: ETA may vary due to traffic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}