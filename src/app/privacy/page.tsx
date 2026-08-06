import type { Metadata } from "next";
import {
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal-page";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: `What ${SITE_NAME} collects, why, and how to have it deleted.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`${SITE_NAME} is a small, independently run link-in-bio service. This page describes exactly what it stores, why, and how to get rid of it. It is written to be read, not to be survived.`}
    >
      <LegalSection heading="Who runs this site">
        <p>
          {SITE_NAME} is operated by an individual, not a company, and is
          self-hosted on hardware the operator controls. For anything in this
          policy, contact{" "}
          <a
            className="underline underline-offset-4 hover:text-ink"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="What we collect from account holders">
        <p>
          You only have an account if you chose to sign in. Signing in with
          Discord or Google passes us a limited set of details from that
          provider, and we store:
        </p>
        <LegalList
          items={[
            "Your account identifier at that provider — a number or string, not your password. We never see, receive or store your provider password.",
            "Your email address, as reported by the provider. It is used to contact you about your account, and nothing else. We do not send marketing email.",
            "The URL of your provider profile picture, used as your default avatar until you upload your own.",
          ]}
        />
        <p>
          Everything else on your page you typed in yourself: your username,
          display name, bio, links, social links, theme colours, SEO title and
          description, and any avatar image you uploaded (stored as a converted
          image file). You can edit or remove any of it at any time from your
          dashboard.
        </p>
      </LegalSection>

      <LegalSection heading="What we collect from visitors">
        <p>
          Visitors to a public profile page are not asked to sign in and are
          not given any cookie. To let page owners see how their page is doing,
          we record:
        </p>
        <LegalList
          items={[
            "A page view: which profile was viewed, and when. Nothing identifying the viewer.",
            "A link click: which link was clicked, when, and the referring page URL sent by the browser, where one is sent.",
          ]}
        />
        <p>
          These records contain no IP address, no device or browser
          fingerprint, no advertising identifier and no cookie, so they cannot
          be tied back to a person. There is no third-party analytics service,
          no advertising network, and no tracking pixel anywhere on this site.
          Web fonts are served from our own server, so loading a page makes no
          request to any outside company.
        </p>
      </LegalSection>

      <LegalSection heading="Server logs">
        <p>
          Like any web server, the reverse proxy in front of this site writes a
          short-lived access log of requests it handles. Those entries include
          an IP address, the requested path, and the browser&rsquo;s user-agent
          string. They exist to keep the service running and to spot abuse and
          attacks, are kept only as long as useful for that, and are never used
          to build a profile of anyone or shared for any other purpose.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          One cookie, and only after you sign in: a session cookie that keeps
          you signed in. It is HTTP-only and same-site, so other websites
          can&rsquo;t read it. Signing out clears it. There are no analytics,
          advertising or preference cookies, which is why you see no cookie
          banner.
        </p>
      </LegalSection>

      <LegalSection heading="Who else touches your data">
        <LegalList
          items={[
            "Discord and Google — only if you use them to sign in. They tell us who you are; we don't tell them anything about what you do here. Their own privacy policies cover that exchange.",
            "Cloudflare — routes traffic to the server and provides the encrypted connection, so requests pass through its network.",
          ]}
        />
        <p>
          That is the entire list. Your data is not sold, rented, licensed, or
          handed to advertisers or data brokers — not now, and not as a change
          of business model later, because there is no business model.
        </p>
      </LegalSection>

      <LegalSection heading="Where your data lives">
        <p>
          On a single self-hosted server, in a database file the operator
          controls, physically located in Australia. It is not replicated to a
          third-party cloud database.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Account and page content is kept until you delete it or ask for your
          account to be removed. View and click records are kept so the
          dashboard can show trends over time, and are deleted along with the
          page they belong to.
        </p>
      </LegalSection>

      <LegalSection heading="Deleting your account">
        <p>
          There is no self-service delete button yet. Email{" "}
          <a
            className="underline underline-offset-4 hover:text-ink"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>{" "}
          from the address on your account, or say which username you want
          removed, and the account, its page, its links, its themes and its
          view and click history will be deleted. We aim to do this within
          seven days.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can ask for a copy of what we hold about you, ask for it to be
          corrected, or ask for it to be deleted. Email the address above.
          Because the amount of data is small, we don&rsquo;t charge for this
          and don&rsquo;t require any particular form of words.
        </p>
        <p>
          If you are in the EU or UK, the lawful bases we rely on are your
          consent (you chose to create a page) and legitimate interests
          (keeping the service running and secure). You may complain to your
          local data protection authority. If you are in Australia, you may
          complain to the Office of the Australian Information Commissioner.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          This service is not intended for children under 13, and accounts are
          not knowingly created for them. If you believe a child under 13 has
          an account, email us and it will be removed.
        </p>
      </LegalSection>

      <LegalSection heading="Security, honestly stated">
        <p>
          Traffic is encrypted in transit, sign-in is delegated to Discord and
          Google so no password is ever stored here, and the server is kept
          patched. That said, this is a hobby project run by one person, not a
          company with a security team. Don&rsquo;t put anything on your page
          that would hurt you if it became public, and treat the service
          accordingly.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          If this policy changes in substance, the effective date at the top
          changes with it. Continuing to use the service after that means the
          updated policy applies to you.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
