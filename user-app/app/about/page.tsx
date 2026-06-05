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
import { useLanguage } from "../../context/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  // Team members data (names and roles are hardcoded as they are proper names)
  const teamMembers = [
    { name: "Eva Lew Tze Ling", role: t("about.team.roles.projectLead"), avatar: "/avatars/avatar1.png" },
    { name: "Chok Li En", role: t("about.team.roles.frontendDatabase"), avatar: "/avatars/avatar2.png" },
    { name: "Tan Yi Chin", role: t("about.team.roles.backendSupport"), avatar: "/avatars/avatar3.png" },
    { name: "Tan Zong Seng", role: t("about.team.roles.iotDeveloper"), avatar: "/avatars/avatar4.png" },
  ];

  // Features data
  const features = [
    {
      icon: FaMapMarkedAlt,
      title: t("about.features.realTimeTracking.title"),
      description: t("about.features.realTimeTracking.description"),
      color: "bg-blue-500/20",
      iconColor: "text-blue-600"
    },
    {
      icon: FaClock,
      title: t("about.features.etaPredictions.title"),
      description: t("about.features.etaPredictions.description"),
      color: "bg-green-500/20",
      iconColor: "text-green-600"
    },
    {
      icon: FaBell,
      title: t("about.features.delayNotifications.title"),
      description: t("about.features.delayNotifications.description"),
      color: "bg-red-500/20",
      iconColor: "text-red-600"
    },
    {
      icon: FaMobileAlt,
      title: t("about.features.crossPlatform.title"),
      description: t("about.features.crossPlatform.description"),
      color: "bg-purple-500/20",
      iconColor: "text-purple-600"
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

          {/* Title Section with Animation */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-8 mt-4"
          >
            <h1 className="text-white text-3xl font-bold font-['Bai_Jamjuree']">
              {t("about.title")}
            </h1>
            <p className="text-white text-base font-medium mt-3 font-['Bai_Jamjuree'] max-w-2xl mx-auto">
              {t("about.subtitle")}
            </p>
          </motion.div>

          {/* Vision & Mission */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col md:flex-row gap-6 mb-16"
          >
            {/* Vision Card */}
            <motion.div variants={fadeInUp}>
              <div className="h-full bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-[#D29C98] flex items-center justify-center">
                    <FaAward className="w-10 h-10 text-[#2F363F]" />
                  </div>
                </div>
                <h2 className="text-[#171821] text-xl font-bold mb-3 font-['Inter']">
                  {t("about.vision.title")}
                </h2>
                <p className="text-[#6E6E6E] text-sm leading-relaxed font-['Inter']">
                  {t("about.vision.description")}
                </p>
              </div>
            </motion.div>

            {/* Mission Card */}
            <motion.div variants={fadeInUp}>
              <div className="h-full bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-[#D29C98] flex items-center justify-center">
                    <FaLightbulb className="w-10 h-10 text-[#2F363F]" />
                  </div>
                </div>
                <h2 className="text-[#171821] text-xl font-bold mb-3 font-['Inter']">
                  {t("about.mission.title")}
                </h2>
                <p className="text-[#6E6E6E] text-sm leading-relaxed font-['Inter']">
                  {t("about.mission.description")}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Features Section */}
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
              {t("about.features.title")}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-center text-white font-medium font-['Bai_Jamjuree'] mb-10 max-w-2xl mx-auto"
            >
              {t("about.features.subtitle")}
            </motion.p>

            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#171821] font-bold text-base font-['Inter'] mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-[#6E6E6E] text-sm leading-relaxed font-['Inter']">
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
              className="text-center text-white text-2xl font-bold font-['Bai_Jamjuree'] mb-3"
            >
              {t("about.team.title")}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-center text-white font-medium font-['Bai_Jamjuree'] mb-10 max-w-2xl mx-auto"
            >
              {t("about.team.subtitle")}
            </motion.p>

            {/* Team Members */}
            <div className="overflow-x-auto md:overflow-visible pb-4">
              <div className="flex md:grid md:grid-cols-4 gap-5 min-w-max md:min-w-0">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex flex-col items-center w-[120px] flex-shrink-0 md:w-auto"
                  >
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