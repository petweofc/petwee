import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/utils/db/prisma';

type UserResponse = {
  name: string;
  username: string;
  id: string;
};

type ClientSession = {
  user: {
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
    id?: string | null | undefined;
  };
  expires?: string;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {},
      async authorize(credentials, req) {
        const {
          accountType,
          fullName,
          email,
          mobilePhone,
          phone,
          gender,
          birthDate,
          cpf,
          username,
          password,
          type,
          termsConsent
        } = credentials as unknown as {
          accountType?: 'INDIVIDUAL' | 'COMPANY';
          fullName?: string;
          email?: string;
          mobilePhone?: string;
          phone?: string;
          gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED';
          birthDate?: string;
          cpf?: string;
          username: string;
          password: string;
          type?: string;
          termsConsent?: boolean;
        };

        if (type === 'login') {
          const loginEndpoint = process.env.NEXTAUTH_LOGIN;
          const res = await fetch(loginEndpoint, {
            method: 'POST',
            body: JSON.stringify({
              username,
              password
            }),
            headers: { 'Content-Type': 'application/json' }
          });

          const user: UserResponse = await res.json();

          if (res.ok && user) {
            return user;
          }
        }

        if (type === 'signup') {
          console.log('NextAuth signup credentials:', credentials);
          const signupEndpoint = process.env.NEXTAUTH_SIGNUP;
          const res = await fetch(signupEndpoint, {
            method: 'POST',
            body: JSON.stringify({
              accountType,
              fullName,
              email,
              mobilePhone,
              phone,
              gender,
              birthDate,
              cpf,
              username,
              password,
              termsConsent
            }),
            headers: { 'Content-Type': 'application/json' }
          });

          console.log('Signup API response status:', res.status);
          const user: UserResponse = await res.json();
          console.log('Signup API response:', user);

          if (res.ok && user) {
            return user;
          }
        }
        return null;
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      let clientSession = session as ClientSession;
      clientSession.user.id = token.sub;
      return session;
    }
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signOut: '/signup'
  }
};

export default NextAuth(authOptions);
