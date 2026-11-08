"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { withBasePath } from "@/lib/base-path";
import { ostGithubUrl, primaryNavigation, routes } from "@/lib/navigation";

// A section stays highlighted on its sub-pages: Media on /blog/talks and on
// every post, Analytics on each of its dashboards. trailingSlash: true means the
// pathname can arrive as "/blog/" as well as "/blog".
function normalize(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

function isActive(pathname: string, href: string): boolean {
  const path = normalize(pathname);
  return path === href || path.startsWith(`${href}/`);
}

type NavItem = (typeof primaryNavigation)[number];
type NavChild = { href: string; label: string; description: string; external?: boolean };

// A dropdown entry, on site or off. Off-site ones open in a new tab and say so
// with an arrow.
function NavChildLink({
  item,
  pathname,
  className,
  children,
}: {
  item: NavChild;
  pathname: string;
  className: string;
  children: ReactNode;
}) {
  if (item.external) {
    return (
      <a href={item.href} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link
      href={item.href}
      className={className}
      aria-current={normalize(pathname) === item.href ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

// "Get involved" -> "get-involved": the mobile group heading's id.
function slug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-");
}

// A dropdown's parent stays highlighted on any of its pages, so Analytics
// lights up on /organizations and /topics too, not just under /analytics.
function isItemActive(pathname: string, item: NavItem): boolean {
  if ("children" in item) {
    return item.children.some((child) => isActive(pathname, child.href));
  }
  return isActive(pathname, item.href);
}

/**
 * A disclosure, not an ARIA menu: a button that shows a list of ordinary
 * links. A mouse opens it on hover; a click, tap or Enter toggles it. Escape,
 * a click elsewhere, or tabbing out closes it.
 */
function NavDropdown({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly NavChild[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const lastPointer = useRef<string | null>(null);
  const menuId = useId();
  const active = items.some((item) => isActive(pathname, item.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      if (rootRef.current?.contains(document.activeElement)) buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <div
      ref={rootRef}
      className="site-nav-dropdown"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        // A short grace period, so cutting a corner on the way down to the
        // panel does not snap it shut.
        closeTimer.current = window.setTimeout(() => setOpen(false), 150);
      }}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="site-nav-link site-nav-dropdown__toggle"
        aria-expanded={open}
        aria-controls={menuId}
        data-active={active || undefined}
        onPointerDown={(event) => {
          lastPointer.current = event.pointerType;
        }}
        onClick={() => {
          // Hover already opened it for a mouse, so a click that toggled
          // would close the panel the moment it was aimed at.
          const fromMouse = lastPointer.current === "mouse";
          lastPointer.current = null;
          setOpen((current) => (fromMouse ? true : !current));
        }}
      >
        {label}
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </button>
      <ul id={menuId} className="site-nav-dropdown__menu" hidden={!open}>
        {items.map((item) => (
          <li key={item.href}>
            <NavChildLink item={item} pathname={pathname} className="site-nav-dropdown__link">
              <span className="site-nav-dropdown__label">
                {item.label}
                {item.external && (
                  <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                )}
              </span>
              <span className="site-nav-dropdown__description">{item.description}</span>
            </NavChildLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
    // Light unless the visitor chose dark with the toggle. The light theme is
    // the design; following the OS put most first-time visitors on the dark
    // one without their asking.
    const resolved = stored === "dark" ? "dark" : "light";
    setTheme(resolved);
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
        <Link className="site-mark" href={routes.home}>
          {/* Decorative: the wordmark beside it already names the site, so an
              alt here would make a screen reader say it twice. */}
          <img
            className="site-mark__logo"
            src={withBasePath("/images/logo.png")}
            alt=""
            width={200}
            height={200}
          />
          <span className="site-mark__word">OpenSustain.Tech</span>
        </Link>

        <div className="header-right">
          <nav className="site-nav" aria-label="Primary">
            {primaryNavigation.map((item) =>
              "children" in item ? (
                <NavDropdown
                  key={item.href}
                  label={item.label}
                  items={item.children}
                  pathname={pathname}
                />
              ) : (
                <Link
                  key={item.href}
                  className="site-nav-link"
                  href={item.href}
                  aria-current={isItemActive(pathname, item) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <a
            href={ostGithubUrl}
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
        {primaryNavigation.map((item) =>
          "children" in item ? (
            // No disclosure inside the menu: it is already one tap deep, so
            // the dashboards are listed outright under their section name.
            <div
              key={item.href}
              className="mobile-nav__group"
              role="group"
              aria-labelledby={`mobile-nav-${slug(item.label)}`}
            >
              <p id={`mobile-nav-${slug(item.label)}`} className="mobile-nav__heading">
                {item.label}
              </p>
              {item.children.map((child) => (
                <NavChildLink
                  key={child.href}
                  item={child}
                  pathname={pathname}
                  className="mobile-nav__link mobile-nav__link--sub"
                >
                  {child.label}
                </NavChildLink>
              ))}
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-nav__link"
              aria-current={isItemActive(pathname, item) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}
