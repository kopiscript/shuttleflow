"use client";

import { useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface FileUploadProps {
  onFileSelect: (files: File[] | null) => void;
  selectedFiles: File[] | null;
}

export default function FileUpload({
  onFileSelect,
  selectedFiles,
}: FileUploadProps) {
  const { t } = useLanguage();
  const MAX_FILES = 3;
  const MAX_FILE_SIZE = 4 * 1024 * 1024;
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";

    if (files.length === 0) return;

    setFileError(null);

    const currentFiles = selectedFiles ?? [];

    if (currentFiles.length + files.length > MAX_FILES) {
      setFileError(
        "You cannot upload more than 3 files. Please select fewer files.",
      );
      return;
    }

    const invalidFile = files.find(
      (file) => file.type !== "image/jpeg" && file.type !== "image/png",
    );

    if (invalidFile) {
      setFileError("Only JPG and PNG files are allowed.");
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      setFileError(
        `"${oversizedFile.name}" exceeds the 4 MB upload limit. Please choose a smaller file.`,
      );
      return;
    }

    onFileSelect([...currentFiles, ...files]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFileError(null);
    if (selectedFiles) {
      const newFiles = selectedFiles.filter(
        (_, index) => index !== indexToRemove,
      );
      onFileSelect(newFiles.length > 0 ? newFiles : null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(jpg|jpeg)$/i)) return "🖼️";
    if (fileName.match(/\.(png)$/i)) return "📷";
    return "📄";
  };

  return (
    <div className="mb-8 relative">
      {/* Container - Light: white, Dark: #A88F92 */}
      <div className="w-full bg-white border border-gray-200 rounded-xl shadow-md dark:bg-[#A88F92] dark:border-white/20">
        {/* File Upload label */}
        <div className="px-4 pt-3 pb-4">
          <span className="text-black font-bold dark:text-white">
            {t("support.fileUpload.title")}
          </span>
          <p className="text-gray-400 text-xs mt-1 dark:text-white/70">
            {t("support.fileUpload.maxFiles")}
          </p>
        </div>

        {/* Add File button - Color #CF2B10 */}
        <div className="px-4 pb-4 relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-10 py-2 bg-[#99121A] hover:bg-[#7a0e15] text-white font-medium rounded-2xl transition-colors text-sm"
          >
            {t("support.fileUpload.addFiles")}
          </button>

          {fileError && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-600 dark:text-red-200"
            >
              {fileError}
            </p>
          )}

          {/* File Preview Cards */}
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between dark:bg-white/20 dark:border-white/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getFileIcon(file.name)}</div>
                    <div>
                      <p className="text-black font-medium text-sm dark:text-white">
                        {file.name.length > 30
                          ? file.name.substring(0, 27) + "..."
                          : file.name}
                      </p>
                      <p className="text-gray-400 text-xs dark:text-white/70">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors dark:text-white/70 dark:hover:text-red-400"
                    title={t("support.fileUpload.remove")}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-gray-400 text-xs mt-4 dark:text-white/50">
            {t("support.fileUpload.supportedTypes")}
          </p>
        </div>
      </div>
    </div>
  );
}
