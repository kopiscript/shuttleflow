"use client";

import { useState, useEffect } from "react";

interface AdminProfile {
  id: number;
  username: string;
  email: string;
  pendingEmail?: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailMessage, setEmailMessage] = useState({
    type: "",
    text: "",
  });

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch profile
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.admin);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Save username
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile?.username,
          email: profile?.email, // send current email (unchanged)
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProfile(data.admin);
        setMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  // Request email change
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChanging(true);
    setEmailMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/profile/request-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailMessage({ type: "success", text: data.message });
        setNewEmail("");
        fetchProfile(); // refresh to show pendingEmail
      } else {
        setEmailMessage({ type: "error", text: data.error });
      }
    } catch {
      setEmailMessage({ type: "error", text: "Failed to send verification email" });
    } finally {
      setEmailChanging(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          type: "success",
          text: "Password changed successfully!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to change password" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#96DDFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#87888C] font-['Inter'] text-sm">
          Profile not found
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Admin Profile
        </h1>
        <p className="text-[#87888C] mt-2 font-['Inter'] text-sm">
          Manage your account information and password.
        </p>
      </div>

      {/* Message Banner */}
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

      {/* Username Section */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] mb-6">
        <div className="px-6 py-4 border-b border-[#2C2D33]">
          <h2 className="text-white font-semibold font-['Inter'] text-base">
            Username
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
          <div>
            <label className="block text-[#87888C] font-['Inter'] text-sm mb-2">
              Username
            </label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) =>
                setProfile({ ...profile, username: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-[#1D1E27] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-[#87888C] font-['Inter'] text-sm mb-2">
              Member Since
            </label>
            <input
              type="text"
              value={new Date(profile.createdAt).toLocaleDateString("en-MY", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              disabled
              className="w-full px-4 py-2.5 bg-[#171821] text-[#87888C] rounded-lg border border-[#2C2D33] font-['Inter'] text-sm cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Username"}
          </button>
        </form>
      </div>

      {/* Email Section */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] mb-6">
        <div className="px-6 py-4 border-b border-[#2C2D33]">
          <h2 className="text-white font-semibold font-['Inter'] text-base">
            Email
          </h2>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-[#87888C] font-['Inter'] text-sm mb-2">
              Current Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2.5 bg-[#171821] text-[#87888C] rounded-lg border border-[#2C2D33] font-['Inter'] text-sm cursor-not-allowed"
            />
          </div>

          {/* Pending email indicator */}
          {profile.pendingEmail && (
            <div className="px-4 py-3 rounded-lg bg-[#FFF4CC]/10 border border-[#FEB002]">
              <p className="text-[#FEB002] font-['Inter'] text-xs">
                ⏳ <strong>Pending change:</strong> A verification email was
                sent to <span className="break-all">{profile.pendingEmail}</span>.
                Please check your inbox to confirm.
              </p>
            </div>
          )}

          {emailMessage.text && (
            <div
              className={`px-4 py-3 rounded-lg font-['Inter'] text-sm border ${
                emailMessage.type === "success"
                  ? "bg-[#E1FFDA]/10 border-[#3EB900] text-[#3EB900]"
                  : "bg-[#FFC0B9]/10 border-[#EA1701] text-[#EA1701]"
              }`}
            >
              {emailMessage.text}
            </div>
          )}

          <form onSubmit={handleRequestEmailChange} className="space-y-4">
            <div>
              <label className="block text-[#87888C] font-['Inter'] text-sm mb-2">
                New Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1D1E27] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#87888C]"
                placeholder="Enter new email address"
                required
              />
              <p className="text-[#87888C] font-['Inter'] text-xs mt-2">
                A verification link will be sent to the new email. Your email
                won't change until you click the link.
              </p>
            </div>

            <button
              type="submit"
              disabled={emailChanging}
              className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50"
            >
              {emailChanging ? "Sending..." : "Send Verification Email"}
            </button>
          </form>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33]">
        <div className="px-6 py-4 border-b border-[#2C2D33] flex items-center justify-between">
          <h2 className="text-white font-semibold font-['Inter'] text-base">
            Password
          </h2>
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="text-[#96DDFF] hover:text-[#7ec4e8] font-['Inter'] text-sm font-medium transition"
          >
            {showPasswordSection ? "Cancel" : "Change Password"}
          </button>
        </div>

        <div className="p-6">
          {!showPasswordSection ? (
            <p className="text-[#87888C] font-['Inter'] text-sm">
              Click "Change Password" to update your password.
            </p>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-[#87888C] font-['Inter'] text-sm mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 bg-[#1D1E27] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87888C] hover:text-white transition"
                  >
                    {showCurrentPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#87888C] font-['Inter'] text-sm mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 bg-[#1D1E27] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87888C] hover:text-white transition"
                  >
                    {showNewPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[#87888C] font-['Inter'] text-xs mt-1.5">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label className="block text-[#87888C] font-['Inter'] text-sm mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 bg-[#1D1E27] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87888C] hover:text-white transition"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}