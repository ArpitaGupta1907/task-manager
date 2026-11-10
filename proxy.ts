import { clerkMiddleware } from '@clerk/nextjs/server';

const publicRoutes = ['/', '/sign-in/*', '/sign-up/*'];
const protectedRoutes = ['/dashboard/*', '/settings/*'];

function compileRoutes(patterns: string[]) {
  return patterns.map((pattern) => {
    const includesChildren = pattern.endsWith('/*');
    const base = includesChildren ? pattern.slice(0, -2) : pattern;

    const escaped = base
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');

    return new RegExp(`^${escaped}${includesChildren ? '(?:/.*)?' : ''}$`);
  });
}

const publicMatchers = compileRoutes(publicRoutes);
const protectedMatchers = compileRoutes(protectedRoutes);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  const isPublic = publicMatchers.some((pattern) => pattern.test(pathname));
  const isProtected = protectedMatchers.some((pattern) => pattern.test(pathname));

  if (!isPublic && isProtected) {
    const { isAuthenticated, redirectToSignIn } = await auth();

    if (!isAuthenticated) {
      return redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
