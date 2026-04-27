"use client";

import useOutsideClick from "@/shared/hooks/useClickOutside";
import { RefObject, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  title?: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  open?: boolean;
  withBtn?: boolean;
  onConfirm?: () => void;
  bg?: string;
};

const Modal = ({
  title,
  description,
  onClose,
  children,
  open,
  bg,
  //   withBtn = false,
  //   onConfirm,
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(
    onClose,
  ) as RefObject<HTMLDivElement>;

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) return null;
  return createPortal(
    <div className="backdrop-blur-sm fixed inset-0 bg-black/30 z-50 flex items-center justify-center ">
      <div
        ref={ref}
        className={` 
                          ${bg ? bg : "bg-white"}   rounded-xl shadow-2xl border border-slate-500
                            max-h-[85vh] md:max-h-[88vh]
                            flex flex-col           
                            overflow-hidden            
                          `}
      >
        <div className="shrink-0 px-5 pt-5 pb-4 border border-slate-500 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 ">
              {title && (
                <h2 className="text-lg md:text-xl font-bold text-slate-500">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="hover:text-red-500  cursor-pointer text-black text-xl  p-1.5 rounded-md transition-all duration-300"
            >
              x
            </button>
            {/* <CloseButton
              className="hover:text-red-500 text-xl ho hover:bg-slate-100 p-1.5 rounded-md"
              onClick={onClose}
            /> */}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 hide_scroll">
          {children}
        </div>
        {/* {withBtn && (
          <div className="p-5 flex gap-x-3 justify-end">
            <Button variant="solid" onClick={onClose}>
              لغو
            </Button>
            <Button
              onClick={onConfirm}
              variant="solid"
              color="#ef4444"
              className=" bg-red-500 text-white "
            >
              حذف
            </Button>
          </div>
        )} */}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
