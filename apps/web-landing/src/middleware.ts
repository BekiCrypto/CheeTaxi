import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'am', 'fr', 'om', 'ti', 'so', 'sw', 'pt', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // /en hidden, others visible
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
