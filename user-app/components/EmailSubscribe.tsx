"use client";

import { useState } from "react";

export default function EmailSubscribe() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const response = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus("success");
                setMessage(data.message || "Check your email to confirm subscription!");
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.error || "Something went wrong");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Network error. Please try again.");
        }
    };

    return (
        <div className="w-full bg-(--glass-bg) backdrop-blur-md border border-white/30 rounded-xl shadow-md py-5 px-4">
            <div className="mb-3">
                <h3 className="text-(--dropdown-text) font-bold text-base">
                    📧 Get Email Alerts
                </h3>
                <p className="text-(--dropdown-text)/70 text-sm mt-1">
                    Subscribe to receive bus delay and schedule updates via email.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={status === "loading"}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99121A]/50 focus:border-[#99121A] disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="px-6 py-2.5 bg-[#99121A] hover:bg-[#7a0e15] text-white font-semibold rounded-lg transition disabled:opacity-50 text-sm"
                >
                    {status === "loading" ? "Sending..." : "Subscribe"}
                </button>
            </form>

            {message && (
                <p className={`text-sm mt-3 ${status === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {message}
                </p>
            )}
        </div>
    );
}