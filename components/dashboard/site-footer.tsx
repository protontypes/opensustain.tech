import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">OpenSustain Analytics</span>
            <p className="footer-copyright">
              © {new Date().getFullYear()} OpenSustain.tech
            </p>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <Link href="/">Overview</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/organizations">Organizations</Link>
            <Link href="/topics">Topics</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
