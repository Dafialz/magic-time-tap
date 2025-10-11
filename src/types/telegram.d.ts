export {};

declare global {
  interface TelegramWebApp {
    ready(): void;
    expand(): void;
    setHeaderColor?: (color: string) => void;
    setBackgroundColor?: (color: string) => void;
  }

  interface TelegramWindow extends Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }

  const window: TelegramWindow;
}
