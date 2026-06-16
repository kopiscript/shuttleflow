"use client";

import PageShell from "../../components/PageShell";
import { FaAward, FaLightbulb } from "react-icons/fa6";
import {
  FaMapMarkedAlt,
  FaClock,
  FaBell,
  FaMobileAlt
} from "react-icons/fa";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutPage() {
  // Team members data (names and roles)
  const teamMembers = [
    { name: "Eva Lew Tze Ling", role: "Project Lead & UI/UX Designer", avatar: "/avatars/eva.png" },
    { name: "Chok Li En", role: "Database Developer", avatar: "/avatars/lien.png" },
    { name: "Tan Yi Chin", role: "Frontend & Backend Support Developer", avatar: "/avatars/casey.png" },
    { name: "Tan Zong Seng", role: "IoT Developer", avatar: "/avatars/johnson.png" },
  ];

  // Features data
  const features = [
    {
      icon: FaMapMarkedAlt,
      title: "Real-time GPS Tracking",
      description: "Track your shuttle's live location on an interactive map with accurate positioning.",
      color: "bg-blue-500/20",
      iconColor: "text-blue-500 dark:text-blue-400"
    },
    {
      icon: FaClock,
      title: "Accurate ETA Predictions",
      description: "Get precise arrival times based on real-time traffic conditions and historical data.",
      color: "bg-green-500/20",
      iconColor: "text-green-500 dark:text-green-400"
    },
    {
      icon: FaBell,
      title: "Instant Delay Notifications",
      description: "Receive immediate alerts about delays, breakdowns, or schedule changes.",
      color: "bg-red-500/20",
      iconColor: "text-red-500 dark:text-red-400"
    },
    {
      icon: FaMobileAlt,
      title: "Cross-platform Web Access",
      description: "Access from any device - phone, tablet, or laptop - no app installation needed.",
      color: "bg-purple-500/20",
      iconColor: "text-purple-500 dark:text-purple-400"
    }
  ];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <PageShell>
      {/* Scrollable Content Area */}
      <div className="px-6 pb-8 overflow-y-auto h-full">
        <div className="max-w-4xl mx-auto">

          {/* Title Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-8 mt-4"
          >
            <h1 className="text-white text-3xl font-bold font-['Bai_Jamjuree']">
              ShuttleFlow
            </h1>
            <p className="text-white text-base font-medium mt-3 font-['Bai_Jamjuree'] max-w-2xl mx-auto opacity-80">
              ShuttleFlow is a smart campus shuttle tracking system designed to provide
              real-time bus visibility, accurate ETA predictions, and seamless campus
              transportation management for students.
            </p>
          </motion.div>

          {/* Mission & Vision - Glass Effect */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col md:flex-row gap-6 mb-16"
          >
            {/* Mission Card - Glass Effect */}
            <motion.div variants={fadeInUp}>
              <div className="h-full bg-[var(--glass-bg)] backdrop-blur-md border border-white/30 dark:border-white/10 rounded-xl shadow-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-[#D29C98] dark:bg-[#2B2B2B] flex items-center justify-center">
                    <FaLightbulb className="w-10 h-10 text-[#2F363F] dark:text-[#FEB002]" />
                  </div>
                </div>
                <h2 className="text-[var(--glass-text)] dark:text-white text-xl font-bold mb-3 font-['Inter']">
                  Mission
                </h2>
                <p className="text-[var(--glass-text)] dark:text-white/80 text-sm leading-relaxed font-['Inter'] opacity-80">
                  To enhance campus mobility by delivering a reliable, real-time, and user-friendly
                  shuttle tracking experience that improves convenience, safety, and transportation
                  efficiency for the university community.
                </p>
              </div>
            </motion.div>

            {/* Vision Card - Glass Effect */}
            <motion.div variants={fadeInUp}>
              <div className="h-full bg-[var(--glass-bg)] backdrop-blur-md border border-white/30 dark:border-white/10 rounded-xl shadow-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-[#D29C98] dark:bg-[#2B2B2B] flex items-center justify-center">
                    <FaAward className="w-10 h-10 text-[#2F363F] dark:text-[#FEB002]" />
                  </div>
                </div>
                <h2 className="text-[var(--glass-text)] dark:text-white text-xl font-bold mb-3 font-['Inter']">
                  Vision
                </h2>
                <p className="text-[var(--glass-text)] dark:text-white/80 text-sm leading-relaxed font-['Inter'] opacity-80">
                  To become a smart and scalable campus transportation platform that transforms
                  the way students and staff experience daily commuting through technology-driven
                  mobility solutions.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Features Section - Glass Effect */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-center text-white text-2xl font-bold font-['Bai_Jamjuree'] mb-3"
            >
              Key Features
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-center text-white font-medium font-['Bai_Jamjuree'] mb-10 max-w-2xl mx-auto opacity-70"
            >
              Everything you need for a smarter campus commute
            </motion.p>

            {/* 2x2 Grid Layout - Glass Effect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-[var(--glass-bg)] backdrop-blur-md border border-white/30 dark:border-white/10 rounded-xl shadow-md p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center shrink-0`}>
                      <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[var(--glass-text)] dark:text-white font-bold text-base font-['Inter'] mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-[var(--glass-text)] dark:text-white/70 text-sm leading-relaxed font-['Inter']">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Meet the Team Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mb-8"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-center text-foreground text-2xl font-bold font-['Bai_Jamjuree'] mb-6"
            >
              Meet the Team
            </motion.h2>

            {/* Team Members */}
            <div className="overflow-x-auto md:overflow-visible pb-4">
              <div className="flex md:grid md:grid-cols-4 gap-8 min-w-max md:min-w-0 justify-center">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex flex-col items-center w-45 shrink-0 md:w-auto"
                  >
                    <div className="w-45 h-45 mb-3">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          width={180}
                          height={180}
                          className="object-contain w-full h-full"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--card-bg)] rounded-2xl flex items-center justify-center">
                          <svg className="w-16 h-16 text-[var(--notification-time)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <h3 className="text-foreground font-semibold text-center font-['Inter'] text-sm">
                      {member.name}
                    </h3>

                    <p className="text-foreground text-xs text-center font-['Inter'] mt-1 max-w-40 opacity-60">
                      {member.role}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}