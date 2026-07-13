import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "subsaver_consent";

export interface ConsentState {
  analytics_storage: "granted" | "denied";
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
}

interface ConsentBannerProps {
  onClose?: () => void;
}

export function ConsentBanner({ onClose }: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  function handleAccept() {
    const consentState: ConsentState = {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    };
    saveConsent(consentState);
    updateGoogleConsent(consentState);
    setIsVisible(false);
    onClose?.();
  }

  function handleReject() {
    const consentState: ConsentState = {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    };
    saveConsent(consentState);
    updateGoogleConsent(consentState);
    setIsVisible(false);
    onClose?.();
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 px-6 py-4 shadow-lg">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-300">
              Nous utilisons Google Analytics pour comprendre comment vous utilisez SubSaver.
              <Link to="/privacy" className="ml-1 text-luxury-gold hover:underline">
                En savoir plus
              </Link>
            </p>
          </div>

          <div className="flex gap-3 sm:flex-shrink-0">
            <button
              onClick={handleReject}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              <X className="h-4 w-4" />
              Refuser
            </button>
            <button
              onClick={handleAccept}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxury-gold hover:bg-luxury-gold/90 text-slate-900 text-sm font-medium transition-colors"
            >
              <Check className="h-4 w-4" />
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function saveConsent(consent: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

export function getConsent(): ConsentState | null {
  const consent = localStorage.getItem(CONSENT_KEY);
  return consent ? JSON.parse(consent) : null;
}

export function updateGoogleConsent(consent: ConsentState) {
  if (typeof window === "undefined") return;

  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    gtag("consent", "update", {
      ad_user_data: consent.ad_user_data,
      ad_personalization: consent.ad_personalization,
      ad_storage: consent.ad_storage,
      analytics_storage: consent.analytics_storage,
    });
  }
}

export function loadGoogleAnalytics() {
  if (typeof window === "undefined") return;

  const consent = getConsent();
  if (!consent) return;

  // gtag.js script is already loaded by index.html with consent mode defaults
  // Just update based on stored consent
  updateGoogleConsent(consent);
}
