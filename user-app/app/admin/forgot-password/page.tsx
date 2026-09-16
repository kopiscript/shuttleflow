"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    setResetToken(null);

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || "Check your email for reset instructions.",
        });
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171821] px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo2.png"
            alt="Logo"
            width={200}
            height={50}
            className="object-contain"
            priority
          />
        </div>

        <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-8 shadow-[0px_8px_40px_rgba(0,0,0,0.4)]">
          <h1 className="text-white font-['Bai_Jamjuree'] text-2xl font-bold text-center mb-2">
            Forgot Password
          </h1>
          <p className="text-[#87888C] font-['Inter'] text-sm text-center mb-8">
            Enter your email to receive a reset link
          </p>

          {message.text && (
            <div
              className={`mb-6 px-4 py-3 rounded-lg font-['Inter'] text-sm border ${
                message.type === "success"
                  ? "bg-[#E1FFDA]/10 border-[#3EB900] text-[#3EB900]"
                  : "bg-[#FFC0B9]/10 border-[#EA1701] text-[#EA1701]"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Dev mode: show token */}
          {resetToken && (
            <div className="mb-6 p-4 rounded-lg bg-[#96DDFF]/10 border border-[#96DDFF]">
              <p className="text-[#96DDFF] font-['Inter'] text-xs mb-2">
                🔧 Dev Mode — Reset Token:
              </p>
              <Link
                href={`/admin/reset-password?token=${resetToken}`}
                className="text-[#96DDFF] font-['Inter'] text-xs break-all underline"
              >
                Click here to reset password
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[#87888C] font-['Inter'] text-sm mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1D1E27] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#87888C]"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/admin/login"
              className="text-[#96DDFF] font-['Inter'] text-sm hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}