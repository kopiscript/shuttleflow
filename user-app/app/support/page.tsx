// app/support/page.tsx
"use client";

import { useState } from "react";
import PageShell from "../../components/PageShell";
import FileUpload from "./FileUpload";
import SuccessModal from "../../components/SuccessModal";
import { useLanguage } from "../../context/LanguageContext";

type ReportType = "feedback" | "bus_delay" | "driver_issue" | "route_problem" | "other";

export default function SupportPage() {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [reportType, setReportType] = useState<ReportType | "">("");
    const [description, setDescription] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Map report type to display text
    const getReportTypeLabel = (type: ReportType): string => {
        const labels: Record<ReportType, string> = {
            feedback: t("support.reportTypes.feedback"),
            bus_delay: t("support.reportTypes.busDelay"),
            driver_issue: t("support.reportTypes.driverIssue"),
            route_problem: t("support.reportTypes.routeProblem"),
            other: t("support.reportTypes.other")
        };
        return labels[type];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            // Step 1: Upload all files
            let fileUrls: string[] = [];
            if (selectedFiles && selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append('file', file);

                    const uploadResponse = await fetch('/api/fileupload', {
                        method: 'POST',
                        body: formData,
                    });

                    const uploadData = await uploadResponse.json();
                    if (uploadData.success) {
                        fileUrls.push(uploadData.fileUrl);
                    } else {
                        setErrorMessage(`${t("support.uploadFailed")} ${file.name}`);
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            // Step 2: Submit support ticket with multiple file URLs
            const response = await fetch('/api/supporttickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    reportType,
                    description,
                    fileUrls: fileUrls,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowModal(true);
            } else {
                setErrorMessage(data.error || t("support.submitError"));
            }
        } catch (error) {
            console.error("Submit error:", error);
            setErrorMessage(t("support.networkError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEmail("");
        setReportType("");
        setDescription("");
        setSelectedFiles(null);
        setErrorMessage(null);
    };

    return (
        <>
            <PageShell>
                <div className="font-['Inter'] px-6 pb-8 overflow-y-auto h-full">
                    <div className="max-w-md mx-auto">
                        {/* Title Section */}
                        <div className="text-center mb-8 mt-4">
                            <h1 className="font-['Bai_Jamjuree'] text-center text-white text-3xl font-bold">
                                {t("support.title")}
                            </h1>
                            <p className="font-['Bai_Jamjuree'] text-center text-white text-base font-medium mt-2 px-4">
                                {t("support.subtitle")}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Error Message */}
                            {errorMessage && (
                                <div className="mb-7 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Email Input */}
                            <div className="mb-7">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t("support.email")}
                                    required
                                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 focus:border-[#99121A] transition-all shadow-md"
                                />
                            </div>

                            {/* Report Type Dropdown */}
                            <div className="mb-7">
                                <div className="relative">
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value as ReportType)}
                                        required
                                        className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-800 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 focus:border-[#99121A] transition-all shadow-md"
                                    >
                                        <option value="" disabled>{t("support.reportType")}</option>
                                        <option value="feedback">{t("support.reportTypes.feedback")}</option>
                                        <option value="bus_delay">{t("support.reportTypes.busDelay")}</option>
                                        <option value="driver_issue">{t("support.reportTypes.driverIssue")}</option>
                                        <option value="route_problem">{t("support.reportTypes.routeProblem")}</option>
                                        <option value="other">{t("support.reportTypes.other")}</option>
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
                                    placeholder={t("support.description")}
                                    rows={4}
                                    required
                                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 focus:border-[#99121A] transition-all resize-none shadow-md"
                                />
                            </div>

                            {/* File Upload Component */}
                            <FileUpload
                                onFileSelect={setSelectedFiles}
                                selectedFiles={selectedFiles}
                            />

                            {/* Submit Button */}
                            <div className="pt-4">
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
                                            {t("common.submitting")}
                                        </div>
                                    ) : (
                                        t("support.submit")
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </PageShell>

            <SuccessModal isOpen={showModal} onClose={handleCloseModal} />
        </>
    );
}