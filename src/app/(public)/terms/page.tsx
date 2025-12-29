import { Metadata } from "next";
import Link from "next/link";
import { ScrollText, Mail, ExternalLink } from "lucide-react";

/**
 * Site URL for canonical and OG URLs
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://streamd.app";

/**
 * Last updated date for the terms of service
 */
const LAST_UPDATED = "December 29, 2024";

/**
 * Contact email for legal inquiries
 */
const CONTACT_EMAIL = "support@streamdanime.io";

/**
 * Metadata for SEO
 */
export const metadata: Metadata = {
    title: "Terms of Service | STREAMD",
    description:
        "Read the Terms of Service for STREAMD, the anime tracking platform. Understand your rights and responsibilities when using our service.",
    openGraph: {
        title: "Terms of Service | STREAMD",
        description:
            "Read the Terms of Service for STREAMD, the anime tracking platform.",
        type: "website",
        url: `${SITE_URL}/terms`,
    },
    twitter: {
        card: "summary",
        title: "Terms of Service | STREAMD",
        description:
            "Read the Terms of Service for STREAMD, the anime tracking platform.",
    },
    alternates: {
        canonical: `${SITE_URL}/terms`,
    },
};

/**
 * Terms of Service page component
 * Comprehensive terms of service for STREAMD anime tracking platform
 */
export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen bg-background">
            {/* Header Section */}
            <section className="border-b border-border bg-card/50">
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <ScrollText className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Legal
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        These terms govern your use of STREAMD. By using our
                        service, you agree to these terms. Please read them
                        carefully.
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
                    <Section
                        id="introduction"
                        title="1. Introduction & Acceptance"
                    >
                        <p>
                            Welcome to STREAMD! These Terms of Service
                            (&quot;Terms&quot;) govern your access to and use of
                            the STREAMD website, applications, and services
                            (collectively, the &quot;Service&quot;).
                        </p>
                        <p>
                            By creating an account, accessing, or using the
                            Service, you agree to be bound by these Terms. If
                            you do not agree to these Terms, you may not use the
                            Service.
                        </p>
                        <p>
                            STREAMD is an anime tracking platform that allows
                            you to track the anime you watch, rate shows, write
                            reviews, and connect with other anime fans.
                        </p>
                    </Section>

                    {/* Eligibility */}
                    <Section id="eligibility" title="2. Eligibility">
                        <p>To use STREAMD, you must:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>
                                Be at least <strong>13 years of age</strong>
                            </li>
                            <li>
                                Have the legal capacity to enter into a binding
                                agreement
                            </li>
                            <li>
                                Not have been previously banned from STREAMD
                            </li>
                        </ul>
                        <p className="mt-4">
                            If you are under 18 years of age, your parent or
                            legal guardian must agree to these Terms on your
                            behalf.
                        </p>
                        <p className="mt-3">
                            By using the Service, you represent and warrant that
                            you meet all eligibility requirements.
                        </p>
                    </Section>

                    {/* Account Responsibilities */}
                    <Section
                        id="account-responsibilities"
                        title="3. Account Responsibilities"
                    >
                        <Subsection title="3.1 Account Creation">
                            <p>When creating an account, you agree to:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>
                                    Provide accurate, current, and complete
                                    information
                                </li>
                                <li>
                                    Maintain and promptly update your account
                                    information
                                </li>
                                <li>
                                    Keep your login credentials secure and
                                    confidential
                                </li>
                                <li>Not share your account with others</li>
                                <li>
                                    Maintain only one account (no alternate
                                    accounts)
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="3.2 Account Security">
                            <p>You are responsible for:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>
                                    All activity that occurs under your account
                                </li>
                                <li>
                                    Notifying us immediately if you suspect
                                    unauthorized access
                                </li>
                                <li>
                                    Keeping your email address up to date for
                                    important notifications
                                </li>
                            </ul>
                        </Subsection>
                    </Section>

                    {/* Acceptable Use */}
                    <Section
                        id="acceptable-use"
                        title="4. Acceptable Use Policy"
                    >
                        <Subsection title="4.1 Permitted Uses">
                            <p>You may use STREAMD to:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Create and customize your profile</li>
                                <li>
                                    Track anime you are watching, planning to
                                    watch, or have completed
                                </li>
                                <li>Rate anime on a 0-10 scale</li>
                                <li>Write reviews (minimum 50 characters)</li>
                                <li>
                                    Follow other users and view their public
                                    profiles
                                </li>
                                <li>
                                    Import your anime list from MyAnimeList,
                                    AniList, or Kitsu
                                </li>
                                <li>
                                    Set your list or individual entries to
                                    public or private
                                </li>
                                <li>Search for anime and browse the catalog</li>
                            </ul>
                        </Subsection>

                        <Subsection title="4.2 Prohibited Conduct">
                            <p>
                                You agree <strong>NOT</strong> to:
                            </p>
                            <div className="mt-4 space-y-3">
                                <ProhibitedItem
                                    title="Spam"
                                    description="Post repetitive, irrelevant, or promotional content"
                                />
                                <ProhibitedItem
                                    title="Harassment"
                                    description="Bully, threaten, or harass other users"
                                />
                                <ProhibitedItem
                                    title="Hate Speech"
                                    description="Post content that attacks people based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics"
                                />
                                <ProhibitedItem
                                    title="Illegal Content"
                                    description="Post anything illegal under United States law"
                                />
                                <ProhibitedItem
                                    title="Impersonation"
                                    description="Pretend to be someone else or create fake accounts"
                                />
                                <ProhibitedItem
                                    title="Hacking"
                                    description="Attempt to access accounts, data, or systems you don't own"
                                />
                                <ProhibitedItem
                                    title="Scraping"
                                    description="Use bots or automated tools to scrape data without permission"
                                />
                                <ProhibitedItem
                                    title="Circumvention"
                                    description="Bypass rate limits, bans, or security measures"
                                />
                                <ProhibitedItem
                                    title="Malware"
                                    description="Upload viruses, malware, or malicious code"
                                />
                                <ProhibitedItem
                                    title="Misinformation"
                                    description="Spread false information about the service or other users"
                                />
                            </div>
                        </Subsection>
                    </Section>

                    {/* User Content */}
                    <Section id="user-content" title="5. User Content">
                        <Subsection title="5.1 What Counts as User Content">
                            <p>User Content includes:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Reviews you write about anime</li>
                                <li>Personal notes on your anime entries</li>
                                <li>Your username and display name</li>
                                <li>Your avatar or profile picture</li>
                                <li>Any other content you create on STREAMD</li>
                            </ul>
                        </Subsection>

                        <Subsection title="5.2 Content Ownership">
                            <p>
                                You retain ownership of the content you create.
                                However, you are solely responsible for your
                                content and must have the right to post any
                                content you share.
                            </p>
                        </Subsection>

                        <Subsection title="5.3 License to STREAMD">
                            <p>
                                By posting content on STREAMD, you grant us a
                                worldwide, non-exclusive, royalty-free license
                                to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Display your content on the platform</li>
                                <li>Distribute your content to other users</li>
                                <li>Promote your content within the service</li>
                            </ul>
                            <p className="mt-3">
                                This license ends when you delete your content,
                                except for cached copies which may persist
                                briefly.
                            </p>
                        </Subsection>

                        <Subsection title="5.4 Content Guidelines">
                            <p>When creating content, you must:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>
                                    Write reviews that are at least 50
                                    characters
                                </li>
                                <li>Mark spoilers using the spoiler toggle</li>
                                <li>
                                    Keep language civil (no excessive profanity
                                    or slurs)
                                </li>
                                <li>
                                    Write reviews about the anime, not unrelated
                                    topics
                                </li>
                                <li>
                                    Create original content (don&apos;t copy
                                    from other sites)
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="5.5 Content Removal">
                            <p>We reserve the right to remove content that:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Violates these Terms</li>
                                <li>Is reported and found to be harmful</li>
                                <li>Is spam or promotional</li>
                                <li>
                                    Infringes on intellectual property rights
                                </li>
                            </ul>
                        </Subsection>
                    </Section>

                    {/* Third-Party Content */}
                    <Section
                        id="third-party-content"
                        title="6. Third-Party Content"
                    >
                        <Subsection title="6.1 Anime Data">
                            <p>
                                Anime information displayed on STREAMD (titles,
                                synopses, images, etc.) comes from external
                                sources. We do not own this content, and
                                accuracy is not guaranteed. Cover images and
                                banners are property of their respective owners.
                            </p>
                        </Subsection>

                        <Subsection title="6.2 Streaming Links">
                            <p>
                                We may provide links to streaming platforms
                                (Crunchyroll, Netflix, etc.). We are not
                                affiliated with these platforms, availability
                                varies by region, and we are not responsible for
                                content on external sites.
                            </p>
                        </Subsection>
                    </Section>

                    {/* Intellectual Property */}
                    <Section
                        id="intellectual-property"
                        title="7. Intellectual Property"
                    >
                        <Subsection title="7.1 STREAMD's Property">
                            <p>
                                The following are owned by STREAMD and protected
                                by intellectual property laws:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>The STREAMD name, logo, and branding</li>
                                <li>Our website design and source code</li>
                                <li>Our original content and documentation</li>
                            </ul>
                        </Subsection>

                        <Subsection title="7.2 Restrictions">
                            <p>You may not:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>
                                    Use our branding without written permission
                                </li>
                                <li>Copy or redistribute our source code</li>
                                <li>
                                    Create derivative works based on our service
                                </li>
                            </ul>
                            <p className="mt-3">
                                Fair use for reviews, commentary, or news
                                reporting is permitted.
                            </p>
                        </Subsection>
                    </Section>

                    {/* Account Termination */}
                    <Section
                        id="account-termination"
                        title="8. Account Termination"
                    >
                        <Subsection title="8.1 Termination by You">
                            <p>You may delete your account at any time:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Go to Settings &gt; Delete Account</li>
                                <li>
                                    Your account will be &quot;soft
                                    deleted&quot; for 30 days
                                </li>
                                <li>
                                    During this period, you can contact us to
                                    restore it
                                </li>
                                <li>
                                    After 30 days, your data is permanently
                                    deleted
                                </li>
                                <li>
                                    You may request immediate deletion by
                                    contacting us
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="8.2 Termination by Us">
                            <p>
                                We may suspend or terminate your account if you:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Violate these Terms</li>
                                <li>Engage in prohibited conduct</li>
                                <li>Maintain multiple accounts</li>
                                <li>Have an inactive account for 2+ years</li>
                            </ul>
                            <p className="mt-3">
                                When we terminate an account, we will:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Notify you by email when possible</li>
                                <li>Explain the reason for termination</li>
                                <li>
                                    Give you a chance to appeal (except in
                                    severe cases)
                                </li>
                            </ul>
                        </Subsection>
                    </Section>

                    {/* Service Modifications */}
                    <Section
                        id="service-modifications"
                        title="9. Service Modifications"
                    >
                        <p>We reserve the right to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Add, modify, or remove features</li>
                            <li>Change the user interface</li>
                            <li>Introduce premium tiers or pricing</li>
                            <li>Impose or change rate limits</li>
                            <li>
                                Temporarily suspend the service for maintenance
                            </li>
                        </ul>
                        <p className="mt-4">We will:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Provide reasonable notice for major changes</li>
                            <li>
                                Not remove core functionality without warning
                            </li>
                            <li>Always maintain a free tier</li>
                        </ul>
                    </Section>

                    {/* Disclaimers */}
                    <Section id="disclaimers" title="10. Disclaimers">
                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <p className="font-semibold">
                                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND
                                &quot;AS AVAILABLE&quot;
                            </p>
                        </div>
                        <p className="mt-4">We do NOT guarantee:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>100% uptime or availability</li>
                            <li>That the service will be error-free</li>
                            <li>That your data will never be lost</li>
                            <li>That all anime information is accurate</li>
                            <li>Compatibility with all devices or browsers</li>
                        </ul>
                        <p className="mt-4">
                            We disclaim all warranties, express or implied,
                            including but not limited to implied warranties of
                            merchantability, fitness for a particular purpose,
                            and non-infringement.
                        </p>
                    </Section>

                    {/* Limitation of Liability */}
                    <Section
                        id="limitation-of-liability"
                        title="11. Limitation of Liability"
                    >
                        <p>
                            To the maximum extent permitted by applicable law:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>
                                STREAMD is not liable for any indirect,
                                incidental, special, consequential, or punitive
                                damages
                            </li>
                            <li>
                                Our total liability is limited to $100 USD or
                                the amount you paid us in the past 12 months,
                                whichever is greater
                            </li>
                        </ul>
                        <p className="mt-4">We are not responsible for:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>
                                Data loss (though we take precautions to prevent
                                it)
                            </li>
                            <li>Service interruptions</li>
                            <li>Actions of third parties</li>
                            <li>
                                Your reliance on information provided on the
                                service
                            </li>
                        </ul>
                    </Section>

                    {/* Indemnification */}
                    <Section id="indemnification" title="12. Indemnification">
                        <p>
                            You agree to defend, indemnify, and hold harmless
                            STREAMD, its officers, directors, employees, and
                            agents from and against any claims, damages,
                            obligations, losses, liabilities, costs, or debt
                            arising from:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Your use of the Service</li>
                            <li>Your User Content</li>
                            <li>Your violation of these Terms</li>
                            <li>Your violation of any third-party rights</li>
                        </ul>
                    </Section>

                    {/* Governing Law */}
                    <Section
                        id="governing-law"
                        title="13. Governing Law & Disputes"
                    >
                        <p>
                            These Terms are governed by the laws of the United
                            States, without regard to conflict of law
                            principles.
                        </p>
                        <p className="mt-3">
                            Any disputes arising from these Terms or your use of
                            the Service shall be resolved in the federal or
                            state courts located in the United States.
                        </p>
                        <p className="mt-3">
                            Before initiating any legal action, we encourage you
                            to contact us to attempt to resolve the dispute
                            informally.
                        </p>
                    </Section>

                    {/* Changes to Terms */}
                    <Section
                        id="changes-to-terms"
                        title="14. Changes to These Terms"
                    >
                        <p>
                            We may update these Terms from time to time. When we
                            make material changes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>
                                We will update the &quot;Last Updated&quot; date
                            </li>
                            <li>
                                We will notify you via email or a prominent
                                notice on the website
                            </li>
                            <li>We may provide a summary of key changes</li>
                        </ul>
                        <p className="mt-4">
                            Your continued use of the Service after changes take
                            effect constitutes acceptance of the revised Terms.
                            If you do not agree to the new Terms, you must stop
                            using the Service.
                        </p>
                    </Section>

                    {/* Miscellaneous */}
                    <Section id="miscellaneous" title="15. Miscellaneous">
                        <div className="space-y-4">
                            <MiscItem
                                title="Entire Agreement"
                                description="These Terms, together with our Privacy Policy, constitute the entire agreement between you and STREAMD regarding the Service."
                            />
                            <MiscItem
                                title="Severability"
                                description="If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect."
                            />
                            <MiscItem
                                title="No Waiver"
                                description="Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights."
                            />
                            <MiscItem
                                title="Assignment"
                                description="We may assign or transfer these Terms without restriction. You may not assign your rights or obligations without our prior written consent."
                            />
                        </div>
                    </Section>

                    {/* Contact Us */}
                    <Section id="contact" title="16. Contact Us">
                        <p>
                            If you have any questions about these Terms of
                            Service, please contact us:
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
                            href="/privacy"
                            className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                            Privacy Policy
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
 * Prohibited item component for the prohibited conduct list
 */
function ProhibitedItem({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
            <span className="font-semibold text-destructive">{title}:</span>{" "}
            <span className="text-foreground/80">{description}</span>
        </div>
    );
}

/**
 * Miscellaneous item component for the miscellaneous section
 */
function MiscItem({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-3">
            <div className="w-1 bg-muted-foreground/30 rounded-full flex-shrink-0" />
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
