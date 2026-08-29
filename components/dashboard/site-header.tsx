"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { primaryNavigation } from "@/lib/navigation";

export function SiteHeader() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setTheme("dark");
    }
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next === "dark" ? "dark" : "");
    localStorage.setItem("theme", next);
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
              <Link key={item.href} className="site-nav-link" href={item.href}>
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
            <i className="fa-brands fa-github" />
          </a>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            type="button"
          >
            <i className={theme === "light" ? "fa-solid fa-moon" : "fa-solid fa-sun"} />
          </button>
        </div>
      </div>
    </header>
  );
}
