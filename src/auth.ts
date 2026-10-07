import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    signIn({ user }) {
      if (!user.email) return false;
      const userEmail = user.email.toLowerCase();
      // Allow if email is listed in ADMIN_EMAILS
      // In local development, if ADMIN_EMAILS is empty or default, allow for testing
      if (ADMIN_EMAILS.length === 0 && process.env.NODE_ENV !== 'production') {
        return true;
      }
      return ADMIN_EMAILS.includes(userEmail);
    },
    jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.isAdmin = ADMIN_EMAILS.length === 0 && process.env.NODE_ENV !== 'production' 
          ? true 
          : ADMIN_EMAILS.includes(user.email.toLowerCase());
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  secret: process.env.AUTH_SECRET,
});

/**
 * Helper to verify admin authorization in server components or API routes.
 */
export async function verifyAdminSession() {
  const session = await auth();
  if (!session?.user?.email) {
    return { authorized: false, email: null };
  }

  const userEmail = session.user.email.toLowerCase();
  const isAuthorized = ADMIN_EMAILS.length === 0 && process.env.NODE_ENV !== 'production'
    ? true
    : ADMIN_EMAILS.includes(userEmail);

  return { authorized: isAuthorized, email: userEmail };
}
