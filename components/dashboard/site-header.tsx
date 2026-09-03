"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { primaryNavigation } from "@/lib/navigation";

export function SiteHeader() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // localStorage throws outright in some privacy modes and sandboxed frames;
    // there is no error boundary above this, so an exception here blanks the page.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {
      stored = null;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
    setTheme(resolved);
    // The inline script in layout.tsx only ever sets "dark". Writing the
    // resolved value here means [data-theme] is always explicit, which is what
    // the `:root:not([data-theme="light"])` media guards key off.
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);

  // Close the mobile menu on navigation, so a tap on a link does not leave the
  // panel covering the page it just opened.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Theme still applies for this page view; it just will not persist.
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="site-mark" href="/">
          OPENSUSTAIN ANALYTICS
        </Link>

        <div className="header-right">
          <nav className="site-nav" aria-label="Primary">
            {primaryNavigation.map((item) => (
              <Link
                key={item.href}
                className="site-nav-link"
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <a
            href="https://github.com/OpenSustainTech"
            target="_blank"
            rel="noreferrer"
            className="header-github"
            aria-label="GitHub"
          >
            <i className="fa-brands fa-github" aria-hidden="true" />
          </a>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            type="button"
          >
            <i
              className={theme === "light" ? "fa-solid fa-moon" : "fa-solid fa-sun"}
              aria-hidden="true"
            />
          </button>

          <button
            className="nav-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={menuOpen ? "nav-toggle__bars is-open" : "nav-toggle__bars"} />
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        className={menuOpen ? "mobile-nav is-open" : "mobile-nav"}
        aria-label="Primary, mobile"
        hidden={!menuOpen}
      >
        {primaryNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="mobile-nav__link"
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
