"use client";

import { useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
    const { t } = useLanguage();

    // Close modal when pressing Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - darker background */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal - bounces from middle */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce-in">
                <div className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[90vw] p-10 relative">
                    {/* Close X button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Success Icon - Font Awesome check circle */}
                    <div className="flex justify-center mb-4">
                        <FaCheckCircle className="w-16 h-16 text-green-500" />
                    </div>

                    {/* Title */}
                    <h2 className="text-center text-black text-xl font-bold mb-2">
                        {t("successModal.title")}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-center text-gray-400 text-sm">
                        {t("successModal.subtitle")}
                    </p>
                </div>
            </div>
        </>
    );
}