export type AlertTone = "error" | "success" | "info" | "confirm";
export type AppAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => unknown;
};
export type AppAlert = {
  id: number;
  title: string;
  message: string;
  buttons: AppAlertButton[];
  tone: AlertTone;
};
let sequence = 0;
let queue: AppAlert[] = [];
let toasts: AppAlert[] = [];
const toastListeners = new Set<() => void>();
export const toastStore = {
  subscribe(listener: () => void) { toastListeners.add(listener); return () => { toastListeners.delete(listener); }; },
  snapshot: () => toasts[0] ?? null,
  dismiss(id: number) {
    if (toasts[0]?.id !== id) return false;
    toasts = toasts.slice(1); toastListeners.forEach(listener => listener()); return true;
  },
};
let layers: symbol[] = [];
const layerListeners = new Set<() => void>();
export const alertLayers = {
  subscribe(listener: () => void) { layerListeners.add(listener); return () => { layerListeners.delete(listener); }; },
  snapshot: () => layers.at(-1),
  register(id: symbol) {
    layers = [...layers, id]; layerListeners.forEach(listener => listener());
    return () => { layers = layers.filter(layer => layer !== id); layerListeners.forEach(listener => listener()); };
  },
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
export const alertStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  snapshot: () => queue[0] ?? null,
  dismiss(id: number) {
    if (queue[0]?.id !== id) return false;
    queue = queue.slice(1);
    emit();
    return true;
  },
};
export const appAlert = {
  alert(
    title: string,
    message = "",
    buttons?: AppAlertButton[],
    options?: { tone?: AlertTone },
  ) {
    const actions: AppAlertButton[] = buttons?.length ? buttons : [{ text: "متوجه شدم" }];
    const blocking = options?.tone === "confirm" || actions.length > 1 || actions.some(button => button.onPress || button.style === "cancel" || button.style === "destructive");
    const item: AppAlert = { id: ++sequence, title, message, buttons: actions, tone: options?.tone ?? (blocking ? "confirm" : "info") };
    if (!blocking) {
      toasts = [...toasts.slice(0, 3), item];
      toastListeners.forEach(listener => listener());
      return;
    }
    queue = [
      ...queue,
      {
        ...item,
      },
    ];
    emit();
  },
};
