import { createContext } from "react";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
}

export interface ToastContextValue {
  push: (toast: Omit<ToastItem, "id">) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);