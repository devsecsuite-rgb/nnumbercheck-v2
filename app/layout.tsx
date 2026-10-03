import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nnumbercheck.com'),
  title: {
    default: 'NNumberCheck — Free Aircraft N-Number Lookup & History',
    template: '%s | NNumberCheck',
  },
  description:
    'Look up any US aircraft by N-number. Free FAA registration data and 44 years of NTSB accident history. Full history reports for $149.',
  openGraph: {
    type: 'website',
    siteName: 'NNumberCheck',
    url: 'https://nnumbercheck.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NNumberCheck',
  url: 'https://nnumbercheck.com',
  logo: 'https://nnumbercheck.com/logo.png',
  description:
    'Aircraft N-number lookup and history reports. FAA registry data and 44 years of NTSB accident records.',
  email: 'support@nnumbercheck.com',
  sameAs: ['https://nnumbercheck.com'],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'NNumberCheck',
  url: 'https://nnumbercheck.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://nnumbercheck.com/n?number={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        {children}
      </body>
    </html>
  );
}
