import * as React from "react";
import { Link } from "react-router-dom";

interface FooterProps {
  onContactClick?: () => void;
}

/** Footer minimaliste, discret, style Apple — liens légaux, contact, réseaux.
 * onContactClick permet d'ouvrir une modale de contact depuis la page. */
export function Footer({ onContactClick }: FooterProps) {
  return (
    <footer className="mt-24 border-t border-slate-900/5 bg-white/40 px-6 py-8 text-center backdrop-blur-sm">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
        {/* Liens et actions */}
        <nav className="flex flex-col items-center justify-center gap-4 sm:gap-6 text-sm text-luxury-text-light">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={onContactClick}
              className="hover:text-luxury-text transition-colors"
            >
              Contact
            </button>
            <Link to="/privacy" className="hover:text-luxury-text transition-colors">
              Charte de confidentialité
            </Link>
            <a
              href="https://github.com/stanislas57/SubServer"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-luxury-text transition-colors"
            >
              GitHub
            </a>
          </div>
        </nav>

        {/* Mention légale */}
        <p className="text-xs text-luxury-text-light/70">
          © {new Date().getFullYear()} SubServer. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
