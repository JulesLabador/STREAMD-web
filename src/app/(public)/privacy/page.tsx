import { Metadata } from "next";
import Link from "next/link";
import { Shield, Mail, ExternalLink } from "lucide-react";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://streamd.app";

/**
 * Last updated date for the privacy policy
 */
const LAST_UPDATED = "December 29, 2024";

/**
 * Contact email for privacy inquiries
 */
const CONTACT_EMAIL = "support@streamdanime.io";

/**
 * Metadata for SEO
 */
export const metadata: Metadata = {
    title: "Privacy Policy | STREAMD",
    description:
        "Learn how STREAMD collects, uses, and protects your personal information. We use privacy-friendly analytics and never sell your data.",
    openGraph: {
        title: "Privacy Policy | STREAMD",
        description:
            "Learn how STREAMD collects, uses, and protects your personal information.",
        type: "website",
        url: `${SITE_URL}/privacy`,
    },
    twitter: {
        card: "summary",
        title: "Privacy Policy | STREAMD",
        description:
            "Learn how STREAMD collects, uses, and protects your personal information.",
    },
    alternates: {
        canonical: `${SITE_URL}/privacy`,
    },
};

/**
 * Privacy Policy page component
 * Comprehensive privacy policy for STREAMD anime tracking platform
 */
export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-background">
            {/* Header Section */}
            <section className="border-b border-border bg-card/50">
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Legal
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Your privacy matters to us. This policy explains what
                        data we collect, how we use it, and your rights
                        regarding your personal information.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        <strong>Last Updated:</strong> {LAST_UPDATED}
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto space-y-12">
                    {/* Introduction */}
                    <Section id="introduction" title="1. Introduction">
                        <p>
                            STREAMD (&quot;we,&quot; &quot;our,&quot; or
                            &quot;us&quot;) is an anime tracking platform that
                            helps you keep track of the anime you watch. This
                            Privacy Policy explains how we collect, use,
                            disclose, and safeguard your information when you
                            use our website and services.
                        </p>
                        <p>
                            By using STREAMD, you agree to the collection and
                            use of information in accordance with this policy.
                            If you do not agree with our policies and practices,
                            please do not use our services.
                        </p>
                    </Section>

                    {/* Information We Collect */}
                    <Section
                        id="information-collected"
                        title="2. Information We Collect"
                    >
                        <Subsection title="2.1 Account Information">
                            <p>
                                When you create an account, we collect the
                                following information:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>
                                    <strong>Email address</strong> - Required
                                    for account creation, login, and
                                    notifications
                                </li>
                                <li>
                                    <strong>Username</strong> - Your public
                                    identifier (3-30 characters)
                                </li>
                                <li>
                                    <strong>Display name</strong> - Optional
                                    name shown on your profile
                                </li>
                                <li>
                                    <strong>Avatar/profile picture</strong> -
                                    Optional personalization
                                </li>
                                <li>
                                    <strong>Password</strong> - Securely hashed;
                                    we never see or store your actual password
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="2.2 OAuth Data">
                            <p>
                                If you sign up using Google or Discord, we
                                receive:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Your name and email address</li>
                                <li>Profile picture (if available)</li>
                            </ul>
                            <p className="mt-3">
                                We do <strong>NOT</strong> receive your
                                password, contacts, or other account data from
                                these providers. You can revoke access anytime
                                in your Google or Discord account settings.
                            </p>
                        </Subsection>

                        <Subsection title="2.3 Anime Tracking Data">
                            <p>When you track anime, we store:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Which anime you add to your list</li>
                                <li>
                                    Watch status (Planning, Watching, Completed,
                                    Paused, Dropped)
                                </li>
                                <li>Current episode progress</li>
                                <li>Your rating (0-10 scale)</li>
                                <li>Start and completion dates</li>
                                <li>Rewatch count</li>
                                <li>
                                    Personal notes (up to 5,000 characters)
                                </li>
                                <li>
                                    Privacy setting (public or private per
                                    entry)
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="2.4 Social Data">
                            <p>If you use social features, we collect:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>
                                    Users you follow and users who follow you
                                </li>
                                <li>
                                    Reviews you write (minimum 50 characters)
                                </li>
                                <li>
                                    Spoiler flags on your reviews
                                </li>
                                <li>
                                    Helpful votes on reviews
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="2.5 Imported Data">
                            <p>
                                If you import your list from MyAnimeList,
                                AniList, or Kitsu:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>
                                    We process the import file or API data you
                                    provide
                                </li>
                                <li>We match anime to our database</li>
                                <li>
                                    We store the resulting list data (same as
                                    section 2.3)
                                </li>
                                <li>
                                    Import files are deleted after processing
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="2.6 Analytics Data (Privacy-Friendly)">
                            <p>
                                We use{" "}
                                <strong>Plausible Analytics</strong>, a
                                privacy-focused analytics service. This means:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>
                                    <strong>No cookies</strong> are placed on
                                    your device
                                </li>
                                <li>
                                    <strong>No personal data</strong> is
                                    collected
                                </li>
                                <li>
                                    <strong>No cross-site tracking</strong>
                                </li>
                                <li>
                                    Your IP address is <strong>never</strong>{" "}
                                    stored
                                </li>
                            </ul>
                            <p className="mt-3">
                                We only see aggregate, anonymous data such as
                                &quot;500 people visited the homepage
                                today.&quot;
                            </p>
                        </Subsection>

                        <Subsection title="2.7 Technical Data">
                            <p>
                                We temporarily collect technical data to operate
                                the service:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>
                                    <strong>Search queries</strong> - To show
                                    you search results (not stored permanently)
                                </li>
                                <li>
                                    <strong>Session data</strong> - To keep you
                                    logged in (expires after 7 days or logout)
                                </li>
                                <li>
                                    <strong>Cached data</strong> - To make the
                                    site faster (temporary, 5 minutes to 1 hour)
                                </li>
                            </ul>
                        </Subsection>
                    </Section>

                    {/* How We Use Your Information */}
                    <Section
                        id="how-we-use"
                        title="3. How We Use Your Information"
                    >
                        <p>We use your information to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>
                                Provide and maintain the STREAMD service
                            </li>
                            <li>
                                Display your public profile and anime list to
                                other users
                            </li>
                            <li>
                                Calculate and show your watching statistics
                            </li>
                            <li>
                                Power search functionality (anime data only)
                            </li>
                            <li>
                                Send notifications and emails (only if you
                                opt-in)
                            </li>
                            <li>
                                Generate monthly recap summaries (only if you
                                opt-in)
                            </li>
                            <li>
                                Improve our service using aggregate analytics
                            </li>
                            <li>
                                Respond to your inquiries and support requests
                            </li>
                        </ul>
                    </Section>

                    {/* Third-Party Services */}
                    <Section
                        id="third-party-services"
                        title="4. Third-Party Services"
                    >
                        <p>
                            We use the following third-party services to operate
                            STREAMD:
                        </p>
                        <div className="mt-4 space-y-4">
                            <ServiceCard
                                name="Supabase"
                                purpose="Database hosting and authentication"
                                dataAccess="All account and tracking data"
                            />
                            <ServiceCard
                                name="Algolia"
                                purpose="Search functionality"
                                dataAccess="Anime titles and metadata only (NOT your personal data)"
                            />
                            <ServiceCard
                                name="Cloudflare R2"
                                purpose="Image storage"
                                dataAccess="Share cards, avatars"
                            />
                            <ServiceCard
                                name="Plausible"
                                purpose="Privacy-friendly analytics"
                                dataAccess="Anonymous page view data only"
                            />
                            <ServiceCard
                                name="Vercel"
                                purpose="Website hosting"
                                dataAccess="Server logs (IP addresses, kept briefly)"
                            />
                        </div>
                        <p className="mt-4 text-muted-foreground">
                            All services are bound by their own privacy policies
                            and industry-standard security practices.
                        </p>
                    </Section>

                    {/* Data Sharing */}
                    <Section id="data-sharing" title="5. Data Sharing">
                        <p>
                            <strong>We do NOT:</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Sell your personal data to anyone</li>
                            <li>Share your data with advertisers</li>
                            <li>Give your data to data brokers</li>
                            <li>Use your data for targeted advertising</li>
                        </ul>
                        <p className="mt-4">
                            <strong>We may share data:</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>
                                If required by law (court order, subpoena)
                            </li>
                            <li>To protect our rights or safety</li>
                            <li>
                                With service providers listed above (only as
                                needed to operate)
                            </li>
                        </ul>
                    </Section>

                    {/* Your Rights */}
                    <Section id="your-rights" title="6. Your Rights">
                        <p>You have the following rights regarding your data:</p>
                        <div className="mt-4 space-y-4">
                            <RightCard
                                title="View Your Data"
                                description="All your data is visible on your profile page"
                            />
                            <RightCard
                                title="Export Your Data"
                                description="Use the export feature in settings to download your anime list"
                            />
                            <RightCard
                                title="Delete Your Account"
                                description="Go to Settings > Delete Account to remove your data"
                            />
                            <RightCard
                                title="Privacy Controls"
                                description="Make individual entries or your entire list private"
                            />
                            <RightCard
                                title="Update Your Profile"
                                description="Edit your information anytime in Settings"
                            />
                            <RightCard
                                title="Opt Out of Emails"
                                description="Unsubscribe via link in any email or in Settings"
                            />
                        </div>
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold mb-2">
                                Account Deletion Details
                            </h4>
                            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                                <li>
                                    When you delete your account, it&apos;s
                                    &quot;soft deleted&quot; for 30 days
                                </li>
                                <li>
                                    During this time, you can contact us to
                                    restore it
                                </li>
                                <li>
                                    After 30 days, all your data is permanently
                                    deleted
                                </li>
                                <li>
                                    Your reviews may be anonymized (shown as
                                    &quot;deleted user&quot;)
                                </li>
                            </ul>
                        </div>
                    </Section>

                    {/* Data Security */}
                    <Section id="data-security" title="7. Data Security">
                        <p>
                            We implement appropriate security measures to
                            protect your data:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>
                                <strong>Encryption in transit</strong> - All
                                connections use HTTPS/TLS
                            </li>
                            <li>
                                <strong>Password security</strong> - Handled by
                                Supabase using bcrypt hashing
                            </li>
                            <li>
                                <strong>Row Level Security (RLS)</strong> -
                                Database rules ensure you can only access your
                                own data
                            </li>
                            <li>
                                <strong>OAuth security</strong> - We never see
                                or store your Google/Discord password
                            </li>
                            <li>
                                <strong>Regular updates</strong> - We keep our
                                dependencies and systems updated
                            </li>
                        </ul>
                    </Section>

                    {/* Cookies */}
                    <Section id="cookies" title="8. Cookies">
                        <p>We use minimal, essential cookies only:</p>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2 pr-4">
                                            Cookie
                                        </th>
                                        <th className="text-left py-2 pr-4">
                                            Purpose
                                        </th>
                                        <th className="text-left py-2">
                                            Duration
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b border-border/50">
                                        <td className="py-2 pr-4">
                                            Session cookie
                                        </td>
                                        <td className="py-2 pr-4">
                                            Keeps you logged in
                                        </td>
                                        <td className="py-2">
                                            7 days or until logout
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">
                                            Auth token
                                        </td>
                                        <td className="py-2 pr-4">
                                            Authentication
                                        </td>
                                        <td className="py-2">Session-based</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-4">
                            <strong>We do NOT use:</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Advertising cookies</li>
                            <li>Tracking cookies</li>
                            <li>Third-party analytics cookies</li>
                        </ul>
                    </Section>

                    {/* Children's Privacy */}
                    <Section
                        id="childrens-privacy"
                        title="9. Children&apos;s Privacy"
                    >
                        <p>
                            STREAMD is not intended for children under 13 years
                            of age. We do not knowingly collect personal
                            information from children under 13. If you are a
                            parent or guardian and believe your child has
                            provided us with personal information, please
                            contact us at{" "}
                            <a
                                href={`mailto:${CONTACT_EMAIL}`}
                                className="text-primary hover:underline"
                            >
                                {CONTACT_EMAIL}
                            </a>{" "}
                            and we will delete such information.
                        </p>
                    </Section>

                    {/* International Users */}
                    <Section
                        id="international-users"
                        title="10. International Users"
                    >
                        <p>
                            Our servers are located in the United States. If you
                            are accessing STREAMD from outside the United
                            States, please be aware that your information may be
                            transferred to, stored, and processed in the United
                            States. By using our services, you consent to this
                            transfer.
                        </p>
                        <p className="mt-3">
                            We comply with applicable data protection laws and
                            strive to protect your information regardless of
                            where you are located.
                        </p>
                    </Section>

                    {/* Changes to Policy */}
                    <Section
                        id="changes"
                        title="11. Changes to This Policy"
                    >
                        <p>
                            We may update this Privacy Policy from time to time.
                            When we make material changes, we will:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>
                                Update the &quot;Last Updated&quot; date at the
                                top of this page
                            </li>
                            <li>
                                Notify you via email or a prominent notice on
                                our website
                            </li>
                        </ul>
                        <p className="mt-3">
                            Your continued use of STREAMD after any changes
                            indicates your acceptance of the updated Privacy
                            Policy.
                        </p>
                    </Section>

                    {/* Contact Us */}
                    <Section id="contact" title="12. Contact Us">
                        <p>
                            If you have any questions about this Privacy Policy
                            or our data practices, please contact us:
                        </p>
                        <div className="mt-4 p-4 bg-card rounded-lg border border-border flex items-center gap-3">
                            <Mail className="h-5 w-5 text-primary" />
                            <a
                                href={`mailto:${CONTACT_EMAIL}`}
                                className="text-primary hover:underline"
                            >
                                {CONTACT_EMAIL}
                            </a>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            We aim to respond to all inquiries within 48 hours.
                        </p>
                    </Section>

                    {/* Related Links */}
                    <div className="pt-8 border-t border-border">
                        <h3 className="text-lg font-semibold mb-4">
                            Related Documents
                        </h3>
                        <Link
                            href="/terms"
                            className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                            Terms of Service
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

/**
 * Section component for consistent styling
 */
function Section({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="space-y-4 text-foreground/90">{children}</div>
        </section>
    );
}

/**
 * Subsection component for nested content
 */
function Subsection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">{title}</h3>
            <div className="text-foreground/90">{children}</div>
        </div>
    );
}

/**
 * Service card component for third-party services
 */
function ServiceCard({
    name,
    purpose,
    dataAccess,
}: {
    name: string;
    purpose: string;
    dataAccess: string;
}) {
    return (
        <div className="p-4 bg-card rounded-lg border border-border">
            <h4 className="font-semibold">{name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
                <strong>Purpose:</strong> {purpose}
            </p>
            <p className="text-sm text-muted-foreground">
                <strong>Data Access:</strong> {dataAccess}
            </p>
        </div>
    );
}

/**
 * Right card component for user rights section
 */
function RightCard({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-3">
            <div className="w-1 bg-primary rounded-full flex-shrink-0" />
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

