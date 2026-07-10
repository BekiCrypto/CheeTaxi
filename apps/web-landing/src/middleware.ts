import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'am', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // /en hidden, /am and /fr visible
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
