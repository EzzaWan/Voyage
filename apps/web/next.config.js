/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'p.qrsim.net',
        pathname: '/**',
      },
    ],
  },
  // Redirect old code-based country routes to slug-based routes
  async redirects() {
    // Common country codes to slugs (add more as needed)
    const countryRedirects = [
      { code: 'PL', slug: 'poland-esim' },
      { code: 'NL', slug: 'netherlands-esim' },
      { code: 'CA', slug: 'canada-esim' },
      { code: 'US', slug: 'united-states-esim' },
      { code: 'GB', slug: 'united-kingdom-esim' },
      { code: 'FR', slug: 'france-esim' },
      { code: 'DE', slug: 'germany-esim' },
      { code: 'ES', slug: 'spain-esim' },
      { code: 'IT', slug: 'italy-esim' },
      { code: 'JP', slug: 'japan-esim' },
    ].map(({ code, slug }) => ({
      source: `/countries/${code}`,
      destination: `/countries/${slug}`,
      permanent: true, // 308 redirect
    }));

    return countryRedirects;
  },
};

module.exports = nextConfig;

