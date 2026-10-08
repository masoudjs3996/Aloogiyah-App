"use client";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
export default function FormPanel({
  open,
  onClose,
  title,
  children,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  busy?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      className="relative z-[80]"
    >
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-8">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            dir="rtl"
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <DialogTitle className="text-xl font-bold text-slate-900">
                {title}
              </DialogTitle>
              <button
                type="button"
                aria-label="بستن"
                disabled={busy}
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
