import type { Metadata } from "next";

import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";

// Content ported as-is from
// open-sustainable-technology/docs/privacy-policy.md — wording is unchanged,
// only the presentation (this site's tokens/layout instead of the mkdocs
// Material theme) is new.
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How the Open Sustainable Technology website collects and uses information about its visitors.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="page-shell">
      <SectionHeading
        as="h1"
        title="Privacy Policy"
        description="The Open Sustainable Technology Community takes your privacy seriously. To better protect your privacy we provide this privacy policy notice explaining the way your personal information is collected and used."
      />

      <Panel>
        <div className="prose">
          <h3>Collection of Routine Information</h3>
          <p>
            This website tracks basic information about their visitors. This
            information includes, IP addresses, browser details, timestamps
            and referring pages. None of this information can personally
            identify specific visitors to this website. The information is
            tracked for routine administration and maintenance purposes.
          </p>

          <h3>Cookies</h3>
          <p>
            This websites does not use cookies to store information about a
            visitor&rsquo;s preferences and history.
          </p>

          <h3>Advertisement and Other Third Parties</h3>
          <p>
            Even if this website itself does not display any advertising,
            other third parties may use cookies, scripts and/or web beacons to
            track visitors activities on this website in order to display
            advertisements and other useful information. Such tracking is
            done directly by the third parties through their own servers and
            is subject to their own privacy policies. This website has no
            access or control over these cookies, scripts and/or web beacons
            that may be used by third parties. Learn how to{" "}
            <a
              href="http://www.google.com/privacy_ads.html"
              target="_blank"
              rel="noreferrer"
            >
              opt out of Google&rsquo;s cookie usage
            </a>
            .
          </p>

          <h3>Links to Third Party Websites</h3>
          <p>
            We have included links on this website for your use and
            reference. We are not responsible for the privacy policies on
            these websites. You should be aware that the privacy policies of
            these websites may differ from our own.
          </p>

          <h3>Security</h3>
          <p>
            The security of your personal information is important to us,
            but remember that no method of transmission over the Internet, or
            method of electronic storage, is 100% secure. While we strive to
            use commercially acceptable means to protect your personal
            information, we cannot guarantee its absolute security.
          </p>

          <h3>Changes To This Privacy Policy</h3>
          <p>
            This Privacy Policy is effective as of 18.01.2025 and will remain
            in effect except with respect to any changes in its provisions in
            the future, which will be in effect immediately after being
            posted on this page.
          </p>
          <p>
            We reserve the right to update or change our Privacy Policy at
            any time and you should check this Privacy Policy periodically.
            If we make any material changes to this Privacy Policy, we will
            notify you either through the email address you have provided us,
            or by placing a prominent notice on our website.
          </p>

          <h3>Contact Information</h3>
          <p>
            For any questions or concerns regarding the privacy policy,
            please send us an email to{" "}
            <a href="mailto:OpenSustaintech@gmail.com">
              OpenSustaintech@gmail.com
            </a>
            .
          </p>
        </div>
      </Panel>
    </main>
  );
}
