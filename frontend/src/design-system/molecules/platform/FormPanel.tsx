"use client";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ActionBarInPanel } from "./ActionBar";
import type { ReactNode } from "react";
export default function FormPanel({
  open,
  onClose,
  title,
  children,
  busy = false,
  placement = "center",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  busy?: boolean;
  placement?: "center" | "bottom";
}) {
  const isBottomSheet = placement === "bottom";

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      className="relative z-[80]"
    >
      <div
        className="fixed inset-0 bg-slate-950/35"
        aria-hidden="true"
      />
      <div className={`fixed inset-0 overflow-y-auto ${isBottomSheet ? "flex items-end sm:items-center sm:p-8" : "p-0 md:p-8"}`}>
        <div className={isBottomSheet ? "w-full" : "flex min-h-full items-end justify-center md:items-center"}>
          <DialogPanel
            dir="rtl"
            className={`w-full bg-white p-5 shadow-xl ${isBottomSheet ? "max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:mx-auto sm:max-h-[calc(100dvh-4rem)] sm:max-w-2xl sm:rounded-2xl sm:p-8" : "max-h-[90dvh] max-w-2xl overflow-y-auto rounded-t-2xl md:rounded-2xl md:p-8"}`}
          >
            {isBottomSheet && <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />}
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
            <ActionBarInPanel.Provider value={true}>{children}</ActionBarInPanel.Provider>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
