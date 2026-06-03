"use client";

import PageShell from "../../components/PageShell";
import { FaAward, FaLightbulb } from "react-icons/fa6";
import Image from "next/image";

export default function AboutPage() {
  // Team members data
  const teamMembers = [
    { name: "Eva Lew Tze Ling", role: "Project Lead & UI/UX Designer", avatar: "/avatars/avatar1.png" },
    { name: "Chok Li En", role: "Frontend & Database Developer", avatar: "/avatars/avatar2.jpeg" },
    { name: "Tan Yi Chin", role: "Frontend & Backend Support Developer", avatar: "/avatars/avatar3.png" },
    { name: "Tan Zong Seng", role: "IoT Developer", avatar: "/avatars/avatar4.png" },
  ];

  return (
    <PageShell>
      {/* Scrollable Content Area - Title is now inside here */}
      <div className="px-6 pb-8 overflow-y-auto h-full">
        <div className="max-w-6xl mx-auto">
          {/* Title Section - Now scrolls with content */}
          <div className="text-center mb-8 mt-4">
            <h1 className="text-white text-3xl font-bold font-['Bai_Jamjuree']">
              About Us
            </h1>
            <p className="text-white text-base font-medium mt-3 font-['Bai_Jamjuree'] max-w-2xl mx-auto">
              ShuttleFlow is a smart campus shuttle tracking system designed to provide 
              real-time bus visibility, accurate ETA predictions, and seamless campus 
              transportation management for students.
            </p>
          </div>

          {/* Vision & Mission - Side by side on desktop, stacked on mobile */}
          <div className="flex flex-col md:flex-row gap-6 mb-12">
            {/* Vision Card */}
            <div className="flex-1 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-[#D29C98] flex items-center justify-center">
                  <FaAward className="w-10 h-10 text-[#2F363F]" />
                </div>
              </div>
              <h2 className="text-[#171821] text-xl font-bold mb-3 font-['Inter']">
                Our Vision
              </h2>
              <p className="text-[#6E6E6E] text-sm leading-relaxed font-['Inter']">
                To enhance campus mobility by delivering a reliable, real-time, and user-friendly 
                shuttle tracking experience that improves convenience, safety, and transportation 
                efficiency for the university community.
              </p>
            </div>

            {/* Mission Card */}
            <div className="flex-1 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-[#D29C98] flex items-center justify-center">
                  <FaLightbulb className="w-10 h-10 text-[#2F363F]" />
                </div>
              </div>
              <h2 className="text-[#171821] text-xl font-bold mb-3 font-['Inter']">
                Our Mission
              </h2>
              <p className="text-[#6E6E6E] text-sm leading-relaxed font-['Inter']">
                To become a smart and scalable campus transportation platform that transforms 
                the way students and staff experience daily commuting through technology-driven 
                mobility solutions.
              </p>
            </div>
          </div>

          {/* Meet the Team Section */}
          <h2 className="text-center text-white text-2xl font-bold font-['Bai_Jamjuree'] mb-6">
            Meet the Team
          </h2>

          {/* Team Members - Horizontal scroll on mobile, grid on desktop */}
          <div className="overflow-x-auto md:overflow-visible pb-4">
            <div className="flex md:grid md:grid-cols-4 gap-5 min-w-max md:min-w-0">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex flex-col items-center w-[100px] flex-shrink-0 md:w-auto">
                  {/* Avatar Circle */}
                  <div className="w-[100px] h-[100px] rounded-full bg-white/70 backdrop-blur-md border border-white/30 shadow-md flex items-center justify-center mb-3 overflow-hidden">
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        width={80}
                        height={80}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-[80px] h-[80px] rounded-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Member Name */}
                  <h3 className="text-[#171821] text-sm font-semibold text-center font-['Inter']">
                    {member.name}
                  </h3>
                  
                  {/* Member Role */}
                  <p className="text-[#6E6E6E] text-xs text-center font-['Inter'] mt-1">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}