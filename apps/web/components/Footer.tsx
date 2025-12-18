import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--voyage-card)] border-t border-[var(--voyage-border)] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--voyage-accent)]">
              Voyage
            </Link>
            <p className="text-[var(--voyage-muted)] text-sm leading-relaxed">
              Global connectivity made simple. Instant eSIM activation for over 190+ countries worldwide.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://twitter.com/voyageesim" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on Twitter"
                className="text-[var(--voyage-muted)] hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/voyageesim" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="text-[var(--voyage-muted)] hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com/company/voyageesim" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on LinkedIn"
                className="text-[var(--voyage-muted)] hover:text-white transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="font-semibold text-white mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-[var(--voyage-muted)]">
              <li>
                <Link href="/" className="hover:text-[var(--voyage-accent)] transition-colors">
                  All eSIM Plans
                </Link>
              </li>
              <li>
                <Link href="/regions/europe" className="hover:text-[var(--voyage-accent)] transition-colors">
                  Europe eSIM
                </Link>
              </li>
              <li>
                <Link href="/regions/asia" className="hover:text-[var(--voyage-accent)] transition-colors">
                  Asia eSIM
                </Link>
              </li>
              <li>
                <Link href="/regions/global" className="hover:text-[var(--voyage-accent)] transition-colors">
                  Global eSIM
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-[var(--voyage-muted)]">
              <li>
                <Link href="/support" className="hover:text-[var(--voyage-accent)] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/support/device-check" className="hover:text-[var(--voyage-accent)] transition-colors">
                  Check Compatibility
                </Link>
              </li>
              <li>
                <Link href="/support?tab=troubleshooting" className="hover:text-[var(--voyage-accent)] transition-colors">
                  Troubleshooting
                </Link>
              </li>
              <li>
                <Link href="/support/contact" className="hover:text-[var(--voyage-accent)] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-[var(--voyage-muted)]">
              <li>
                <Link href="/support?tab=terms" className="hover:text-[var(--voyage-accent)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/support?tab=refund" className="hover:text-[var(--voyage-accent)] transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--voyage-border)] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--voyage-muted)]">
          <p>© {currentYear} Voyage eSIM. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> support@voyage-esim.com
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

