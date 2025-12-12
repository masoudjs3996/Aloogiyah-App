"use client";

import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const BottomSheetModal = ({ isOpen, onClose, children, title }: BottomSheetModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 z-50"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium text-gray-800">{title}</h2>
              <IoClose size={24} className="cursor-pointer" onClick={onClose} />
            </div>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
