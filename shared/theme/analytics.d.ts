export {};
declare global {
  interface Window {
    sieblyDocsAnalytics?: {
      beforeNavigate(href: string): void;
      pageReady(missing?: boolean): void;
    };
  }
}
