// admin-app/app/admin/notifications/page.tsx
"use client";

import { useState } from "react";

type NotificationType = "alert" | "delay" | "announcement" | "info";

interface TypeOption {
  value: NotificationType;
  label: string;
  emoji: string;
  description: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "info",
    label: "Info",
    emoji: "🔔",
    description: "General information for users",
  },
  {
    value: "announcement",
    label: "Announcement",
    emoji: "📢",
    description: "Important updates like schedule changes",
  },
  {
    value: "delay",
    label: "Delay",
    emoji: "🚌",
    description: "Route delay notices",
  },
  {
    value: "alert",
    label: "Alert",
    emoji: "⚠️",
    description: "Urgent issues like breakdowns or disruptions",
  },
];

export default function SendNotificationPage() {
  const [type, setType] = useState<NotificationType>("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("sent");
        setTitle("");
        setMessage("");
        // Auto-hide the success message after 4 seconds
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Failed to send notification");
      }
    } catch (err) {
      console.error("Send error:", err);
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const selectedType = TYPE_OPTIONS.find((t) => t.value === type)!;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Send Notification
        </h1>
        <p className="text-[#87888C] mt-2 font-['Inter'] text-sm">
          Broadcast a message to all users. It appears as a real-time popup and
          in the notification list. Use this for maintenance notices,
          announcements, or any information that isn't triggered automatically.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Type selector */}
            <div>
              <label className="text-white font-bold font-['Inter'] text-base mb-3 block">
                Notification Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`text-left p-4 rounded-xl border transition ${
                      type === opt.value
                        ? "border-[#96DDFF] bg-[#96DDFF]/10"
                        : "border-[#2C2D33] bg-[#171821] hover:border-[#87888C]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="text-white font-semibold font-['Inter'] text-sm">
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-[#87888C] font-['Inter'] text-xs">
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-white font-bold font-['Inter'] text-base mb-2 block">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                placeholder="e.g., Route A Delayed"
                className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#87888C]"
              />
              <p className="text-[#87888C] font-['Inter'] text-xs mt-1">
                {title.length}/200 characters
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="text-white font-bold font-['Inter'] text-base mb-2 block">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="e.g., Route A is delayed by 10 minutes due to heavy traffic."
                className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#87888C] resize-none"
              />
            </div>

            {/* Preview */}
            {(title || message) && (
              <div>
                <label className="text-white font-bold font-['Inter'] text-base mb-2 block">
                  Preview
                </label>
                <div className="p-4 rounded-xl bg-[#171821] border border-[#2C2D33]">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{selectedType.emoji}</span>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold font-['Inter'] text-sm">
                        {title || "(no title)"}
                      </h4>
                      <p className="text-[#87888C] font-['Inter'] text-sm mt-1">
                        {message || "(no message)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#2C2D33]">
            <div className="flex-1">
              {status === "sent" && (
                <p className="text-[#3EB900] font-['Inter'] text-sm">
                  ✅ Notification sent to all connected users
                </p>
              )}
              {status === "error" && (
                <p className="text-[#EA1701] font-['Inter'] text-sm">
                  ❌ {errorMsg}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={sending || !title || !message}
              className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}