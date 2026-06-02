// components/FileUpload.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    selectedFile: File | null;
}

export default function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
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

        if (type === 'camera') {
            input.capture = 'environment';
        }

        input.onchange = (e) => {
            const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
            const file = event.target.files?.[0];
            if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
                onFileSelect(file);
            } else if (file) {
                alert("Only .jpg and .png files are supported");
            }
        };

        input.click();
    };

    const handleRemoveFile = () => {
        onFileSelect(null);
    };

    // Format file size to readable format
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get file icon based on type
    const getFileIcon = (fileName: string) => {
        if (fileName.match(/\.(jpg|jpeg)$/i)) return '🖼️';
        if (fileName.match(/\.(png)$/i)) return '📷';
        return '📄';
    };

    return (
        <div className="mb-8 relative" ref={dropdownRef}>
            {/* White box */}
            <div className="w-full bg-white border border-gray-200 rounded-xl shadow-md">
                {/* File Upload label */}
                <div className="px-4 pt-3 pb-4">
                    <span className="text-black font-bold">
                        File Upload
                    </span>
                </div>

                {/* Add File button */}
                <div className="px-4 pb-4 relative">
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="px-10 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-2xl transition-colors text-sm"
                    >
                        Add File
                    </button>

                    {/* Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute top-0 left-[100px] min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => handleFileSelection('library')}
                                className="w-full py-2.5 text-left px-4 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                            >
                                <span className="text-base">📸</span>
                                <span className="text-gray-700">Photo Library</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleFileSelection('camera')}
                                className="w-full py-2.5 text-left px-4 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm border-t border-gray-100"
                            >
                                <span className="text-base">📷</span>
                                <span className="text-gray-700">Take Photo or Video</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleFileSelection('file')}
                                className="w-full py-2.5 text-left px-4 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm border-t border-gray-100"
                            >
                                <span className="text-base">📁</span>
                                <span className="text-gray-700">Choose File</span>
                            </button>
                        </div>
                    )}

                    {/* File Preview Card - Shows when file is selected */}
                    {selectedFile && (
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                            {/* Left side: Icon + File info */}
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">
                                    {getFileIcon(selectedFile.name)}
                                </div>
                                <div>
                                    <p className="text-black font-medium text-sm">
                                        {selectedFile.name.length > 30
                                            ? selectedFile.name.substring(0, 27) + '...'
                                            : selectedFile.name}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        {formatFileSize(selectedFile.size)}
                                    </p>
                                </div>
                            </div>

                            {/* Right side: Delete button */}
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <p className="text-gray-400 text-xs mt-4">
                        Only support .jpg and .png files
                    </p>
                </div>
            </div>
        </div>
    );
}