'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  className?: string;
}

export interface TurnstileWidgetRef {
  reset: () => void;
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onVerify, className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isDevBypass, setIsDevBypass] = useState(false);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        } else if (isDevBypass) {
          onVerify('dev-bypass-token');
        }
      },
    }));

    useEffect(() => {
      // In development when siteKey is not configured, bypass verification
      if (!siteKey) {
        setIsDevBypass(true);
        onVerify('dev-bypass-token');
        return;
      }

      // Check if turnstile script is already added
      const scriptId = 'cf-turnstile-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      const renderWidget = () => {
        if (!containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) return;

        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerify(token);
            },
            'expired-callback': () => {
              onVerify('');
            },
            'error-callback': () => {
              console.error('Turnstile verification error');
            },
            theme: 'light',
          });
        } catch (err) {
          console.error('Turnstile render failed:', err);
        }
      };

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
        };
        document.head.appendChild(script);
      } else if (window.turnstile) {
        renderWidget();
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Widget may have been unmounted already
          }
          widgetIdRef.current = null;
        }
      };
    }, [onVerify]);

    if (isDevBypass) {
      return (
        <div className={`text-xs text-brown-600 bg-brown-50 border border-brown-200 rounded-md p-2 text-center ${className}`}>
          🛡️ Turnstile captcha otomatis dilewati (Mode Development)
        </div>
      );
    }

    return (
      <div className={`flex justify-center my-2 ${className}`}>
        <div ref={containerRef} />
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
