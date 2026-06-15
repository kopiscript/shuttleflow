"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface FileUploadProps {
    onFileSelect: (files: File[] | null) => void;
    selectedFiles: File[] | null;
}

export default function FileUpload({ onFileSelect, selectedFiles }: FileUploadProps) {
    const { t } = useLanguage();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFileSelection = (type: 'library' | 'camera' | 'file') => {
        setIsDropdownOpen(false);

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.jpg,.jpeg,.png';
        input.multiple = true;

        if (type === 'camera') {
            input.capture = 'environment';
        }

        input.onchange = (e) => {
            const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
            const files = event.target.files;
            if (files && files.length > 0) {
                const validFiles: File[] = [];
                const fileArray = Array.from(files);

                for (const file of fileArray) {
                    if (file.type === "image/jpeg" || file.type === "image/png") {
                        validFiles.push(file);
                    } else {
                        alert(t("support.fileUpload.invalidType"));
                    }
                }

                if (validFiles.length > 0) {
                    const currentFiles = selectedFiles || [];
                    const allFiles = [...currentFiles, ...validFiles];
                    onFileSelect(allFiles);
                }
            }
        };

        input.click();
    };

    const handleRemoveFile = (indexToRemove: number) => {
        if (selectedFiles) {
            const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
            onFileSelect(newFiles.length > 0 ? newFiles : null);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName: string) => {
        if (fileName.match(/\.(jpg|jpeg)$/i)) return '🖼️';
        if (fileName.match(/\.(png)$/i)) return '📷';
        return '📄';
    };

    return (
        <div className="mb-8 relative" ref={dropdownRef}>
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
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="px-10 py-2 bg-[#99121A] hover:bg-[#7a0e15] text-white font-medium rounded-2xl transition-colors text-sm"
                    >
                        {t("support.fileUpload.addFiles")}
                    </button>

                    {/* Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute top-0 left-25 min-w-45 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden dark:bg-[#2B2B2B] dark:border-white/20">
                            <button
                                type="button"
                                onClick={() => handleFileSelection('library')}
                                className="w-full py-2.5 text-left px-4 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-700 dark:hover:bg-[#3D3D3D] dark:text-white"
                            >
                                <span className="text-base">📸</span>
                                <span>{t("support.fileUpload.photoLibrary")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleFileSelection('camera')}
                                className="w-full py-2.5 text-left px-4 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm border-t border-gray-100 text-gray-700 dark:hover:bg-[#3D3D3D] dark:border-white/10 dark:text-white"
                            >
                                <span className="text-base">📷</span>
                                <span>{t("support.fileUpload.takePhoto")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleFileSelection('file')}
                                className="w-full py-2.5 text-left px-4 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm border-t border-gray-100 text-gray-700 dark:hover:bg-[#3D3D3D] dark:border-white/10 dark:text-white"
                            >
                                <span className="text-base">📁</span>
                                <span>{t("support.fileUpload.chooseFiles")}</span>
                            </button>
                        </div>
                    )}

                    {/* File Preview Cards */}
                    {selectedFiles && selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-3">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between dark:bg-white/20 dark:border-white/30">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">
                                            {getFileIcon(file.name)}
                                        </div>
                                        <div>
                                            <p className="text-black font-medium text-sm dark:text-white">
                                                {file.name.length > 30
                                                    ? file.name.substring(0, 27) + '...'
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
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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