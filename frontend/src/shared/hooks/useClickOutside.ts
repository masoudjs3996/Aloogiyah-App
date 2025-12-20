"use client";
import { useEffect, useRef, RefObject } from "react";

type UseOutsideClickHandler = () => void;

export default function useOutsideClick<T extends HTMLElement = HTMLDivElement>(
  handler: UseOutsideClickHandler,
  listenCapturing: boolean = true
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    }

    document.addEventListener("click", handleClick, listenCapturing);

    return () => {
      document.removeEventListener("click", handleClick, listenCapturing);
    };
  }, [handler, listenCapturing]);

  return ref;
}