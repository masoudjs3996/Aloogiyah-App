import React, { useEffect, useRef } from "react";
import { Modal, type ModalProps } from "react-native";
import { alertLayers } from "../../shared/alerts";
import { AppToastHost } from "../organisms/AppToastHost";

// Native modals have their own window; render feedback in the active window.
export function AppModal({ children, visible = true, ...props }: ModalProps) {
  const id = useRef(Symbol("modal")).current;
  useEffect(() => { if (visible) return alertLayers.register(id); }, [visible, id]);
  return <Modal {...props} visible={visible}>{children}<AppToastHost layer={id} /></Modal>;
}
