import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal-page";
import { CONTACT_EMAIL, JURISDICTION, SITE_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms of Use — ${SITE_NAME}`,
  description: `The rules for using ${SITE_NAME}, in plain language.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={`These are the rules for using ${SITE_NAME}. It's a free hobby project, so the terms are short and the promises are modest — but they're real, so please read them.`}
    >
      <LegalSection heading="Agreeing to these terms">
        <p>
          By creating a page or using this site, you agree to these terms and
          to the{" "}
          <Link
            className="underline underline-offset-4 hover:text-ink"
            href="/privacy"
          >
            Privacy Policy
          </Link>
          . If you don&rsquo;t agree with them, please don&rsquo;t use the
          service.
        </p>
      </LegalSection>

      <LegalSection heading="Who can use it">
        <p>
          You must be at least 13 years old. If the law where you live sets a
          higher minimum age for consenting to online services without a
          parent, that age applies to you instead.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          You sign in through Discord or Google. Each provider is a separate
          account here: signing in with Google will not give you access to a
          page you created with Discord, even if both use the same email
          address. That is deliberate, and it means whoever controls the
          provider account controls the page — so keep that account secure.
        </p>
        <p>
          You are responsible for everything done through your account. Tell us
          promptly if you think someone else has got into it.
        </p>
      </LegalSection>

      <LegalSection heading="Your content stays yours">
        <p>
          You keep ownership of everything you put on your page. By putting it
          here you give us permission to store it and to show it to people who
          visit your page — which is simply what the service does, and nothing
          more. That permission ends when you delete the content or your
          account.
        </p>
        <p>
          You confirm you have the right to post what you post, including any
          image you upload.
        </p>
      </LegalSection>

      <LegalSection heading="What you may not do">
        <p>Don&rsquo;t use this service to:</p>
        <LegalList
          items={[
            "Break the law, or help anyone else do so.",
            "Link to or host malware, phishing pages, or anything designed to deceive or defraud people.",
            "Post content that infringes someone else's copyright, trademark, or other rights.",
            "Harass, threaten, defame, or impersonate anyone, or pretend to be a person or organisation you are not.",
            "Post sexual content involving minors, or any content depicting the sexual exploitation of any person. This will be reported.",
            "Send spam, or use the service for bulk unsolicited promotion.",
            "Attack the service — scraping at volume, probing for vulnerabilities without permission, attempting to overload it, or trying to reach other people's accounts or data.",
          ]}
        />
        <p>
          If your page contains adult or otherwise sensitive material that is
          legal but not for everyone, turn on the sensitive content setting so
          visitors get a warning first.
        </p>
      </LegalSection>

      <LegalSection heading="Usernames">
        <p>
          Usernames are first come, first served, and are not property. We may
          reclaim one that impersonates a person or organisation, that was
          registered purely to resell, or that is being used in breach of these
          terms.
        </p>
      </LegalSection>

      <LegalSection heading="Links to other places">
        <p>
          The point of this service is to link elsewhere. We don&rsquo;t
          control, check, or endorse the sites people link to, and we are not
          responsible for them. Follow links at your own judgement.
        </p>
      </LegalSection>

      <LegalSection heading="Availability — please read this one">
        <p>
          This is a free service run by one person on self-hosted hardware.
          There is no uptime guarantee, no support commitment, and no service
          level agreement. It may be slow, may go down, may lose data, and may
          be discontinued. The service is provided &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo;, without warranties of any kind, to the
          fullest extent the law allows.
        </p>
        <p>
          Keep your own copy of anything you would be upset to lose. Do not
          build anything you depend on commercially on top of this.
        </p>
      </LegalSection>

      <LegalSection heading="Limits on liability">
        <p>
          To the fullest extent the law allows, the operator is not liable for
          any indirect or consequential loss, or for lost profits, lost
          business, or lost data arising from your use of the service. Nothing
          in these terms excludes liability that cannot legally be excluded —
          including, for Australian users, rights under the Australian Consumer
          Law.
        </p>
      </LegalSection>

      <LegalSection heading="Ending things">
        <p>
          You can stop using the service whenever you like, and can ask for
          your account to be deleted by emailing{" "}
          <a
            className="underline underline-offset-4 hover:text-ink"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          . We may suspend or remove a page that breaches these terms, and will
          try to tell you why where it&rsquo;s reasonable to do so.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>
          These terms may change. When they change in substance, the effective
          date at the top changes too, and continuing to use the service means
          the new terms apply.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          These terms are governed by the laws of {JURISDICTION}, and the
          courts there have jurisdiction — without taking away any protection
          you have under the law of the country you live in.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions, complaints, or takedown requests:{" "}
          <a
            className="underline underline-offset-4 hover:text-ink"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
