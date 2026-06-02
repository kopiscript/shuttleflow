// app/support/page.tsx
"use client";

import { useState } from "react";
import PageShell from "../../components/PageShell";
import FileUpload from "../../components/FileUpload";
import SuccessModal from "../../components/SuccessModal";

type ReportType = "feedback" | "bus_delay" | "driver_issue" | "route_problem" | "other";

export default function SupportPage() {
    const [email, setEmail] = useState("");
    const [reportType, setReportType] = useState<ReportType | "">("");
    const [description, setDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false); // NEW: modal state

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // TODO: Implement API call to submit support ticket
        console.log({ email, reportType, description, selectedFile });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSubmitting(false);

        // Show success modal instead of alert
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        // Reset form after modal closes
        setEmail("");
        setReportType("");
        setDescription("");
        setSelectedFile(null);
    };

    return (
        <>
            <PageShell
                title="How Can We Help?"
                subtitle="Report an issue or share your feedback about your ride."
            >
                <div className="px-6 pb-8">
                    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                        {/* Email Input */}
                        <div className="mb-7">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 focus:border-[#99121A] transition-all shadow-md"
                            />
                        </div>

                        {/* Report Type Dropdown */}
                        <div className="mb-7">
                            <div className="relative">
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value as ReportType)}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 focus:border-[#99121A] transition-all shadow-md"
                                >
                                    <option value="" disabled>Select report type</option>
                                    <option value="feedback">General Feedback</option>
                                    <option value="bus_delay">Bus Delay</option>
                                    <option value="driver_issue">Driver Issue</option>
                                    <option value="route_problem">Route Problem</option>
                                    <option value="other">Other..</option>
                                </select>
                                <svg
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Description Textarea */}
                        <div className="mb-7">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the issue..."
                                rows={4}
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 focus:border-[#99121A] transition-all resize-none shadow-md"
                            />
                        </div>

                        {/* File Upload Component */}
                        <FileUpload
                            onFileSelect={setSelectedFile}
                            selectedFile={selectedFile}
                        />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-[#99121A] hover:bg-[#7a0e15] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Submitting...
                                </div>
                            ) : (
                                "Submit"
                            )}
                        </button>
                    </form>
                </div>
            </PageShell>

            {/* Success Modal */}
            <SuccessModal isOpen={showModal} onClose={handleCloseModal} />
        </>
    );
}