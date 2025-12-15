"use client";

import { useTheme } from "next-themes";
import { type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const getModalClasses = () => {
    switch (theme) {
      case "dark":
        return "bg-gray-900 text-white border-gray-700";
      case "cassette":
        return "bg-black text-neonGreen border-neonCyan font-dos";
      case "homebrew":
        return "bg-parchment text-maroon border-brown font-dnd";
      default:
        return "bg-white text-black border-gray-300";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={`modal-content rounded p-6 w-full max-w-md relative border transition-all duration-300 shadow-lg ${getModalClasses()}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 modal-close-btn"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

