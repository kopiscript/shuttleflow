"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid confirmation link. No token provided.");
      return;
    }

    const confirmChange = async () => {
      try {
        const res = await fetch("/api/admin/profile/confirm-email-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message);
          setNewEmail(data.newEmail || "");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to confirm email change.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    confirmChange();
  }, [token]);

  return (
    <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-8 shadow-[0px_8px_40px_rgba(0,0,0,0.4)]">
      {/* Loading state */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 border-4 border-[#96DDFF] border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-white font-['Bai_Jamjuree'] text-xl font-bold mb-2">
            Confirming your email...
          </h2>
          <p className="text-[#87888C] font-['Inter'] text-sm">
            Please wait while we verify your request.
          </p>
        </div>
      )}

      {/* Success state */}
      {status === "success" && (
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#E1FFDA]/10 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-[#3EB900]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-white font-['Bai_Jamjuree'] text-2xl font-bold mb-2">
            Email Confirmed!
          </h2>
          <p className="text-[#87888C] font-['Inter'] text-sm mb-2">
            Your email has been successfully updated. You can continue using your
            account with your new email.
          </p>
          {newEmail && (
            <p className="text-[#3EB900] font-['Inter'] text-sm mb-6 break-all">
              <strong>New email:</strong> {newEmail}
            </p>
          )}
          <Link
            href="/admin/profile"
            className="mt-4 px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition"
            >
            Back to Profile
          </Link>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#FFC0B9]/10 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-[#EA1701]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-white font-['Bai_Jamjuree'] text-2xl font-bold mb-2">
            Confirmation Failed
          </h2>
          <p className="text-[#EA1701] font-['Inter'] text-sm mb-6">
            {message}
          </p>
          <Link
            href="/admin/profile"
            className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition"
          >
            Back to Profile
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ConfirmEmailPage() {
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
        <Suspense
          fallback={
            <div className="text-white text-center font-['Inter']">
              Loading...
            </div>
          }
        >
          <ConfirmEmailContent />
        </Suspense>
      </div>
    </div>
  );
}