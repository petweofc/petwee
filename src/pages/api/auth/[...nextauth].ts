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
  debug: true,
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
      async authorize(credentials: any, req) {
        const {
          name,
          username,
          password,
          type,
          personType,
          cpf,
          cnpj,
          birthDate,
          gender,
          phone,
          whatsapp,
          companyName,
          tradeName,
          stateRegistration
        } = credentials as any;
        
        if (type === 'login') {
          const loginEndpoint = process.env.NEXTAUTH_LOGIN;
          console.log('[NextAuth][authorize][login] endpoint:', loginEndpoint, 'username:', username);
          try {
            const res = await fetch(loginEndpoint, {
              method: 'POST',
              body: JSON.stringify({
                username,
                password
              }),
              headers: { 'Content-Type': 'application/json' }
            });

            console.log('[NextAuth][authorize][login] response status:', res.status);
            let user: UserResponse | null = null;
            try {
              user = (await res.json()) as UserResponse;
            } catch (e) {
              console.error('[NextAuth][authorize][login] JSON parse failed:', e);
            }
            console.log('[NextAuth][authorize][login] response body:', user);

            if (res.ok && user) {
              return user;
            }
          } catch (error) {
            console.error('[NextAuth][authorize][login] fetch error:', error);
          }
        }

        if (type === 'signup') {
          const signupEndpoint = process.env.NEXTAUTH_SIGNUP;
          console.log('[NextAuth][authorize][signup] endpoint:', signupEndpoint, 'username:', username);
          try {
          const res = await fetch(signupEndpoint, {
            method: 'POST',
            body: JSON.stringify({
              name,
              username,
              password,
              personType,
              cpf,
              cnpj,
              birthDate,
              gender,
              phone,
              whatsapp,
              companyName,
              tradeName,
              stateRegistration,
              stateRegistrationIsento: (credentials as any)?.stateRegistrationIsento,
              alternatePhone: (credentials as any)?.alternatePhone,
              pfDefinition: (credentials as any)?.pfDefinition,
              pjDefinition: (credentials as any)?.pjDefinition,
              // endereço
              addressLabel: (credentials as any)?.addressLabel,
              addressLine1: (credentials as any)?.addressLine1,
              addressLine2: (credentials as any)?.addressLine2,
              StreetNumber: (credentials as any)?.StreetNumber,
              city: (credentials as any)?.city,
              postalCode: (credentials as any)?.postalCode,
              region: (credentials as any)?.region,
              country: (credentials as any)?.country || 'Brasil'
            }),
            headers: { 'Content-Type': 'application/json' }
          });

            console.log('[NextAuth][authorize][signup] response status:', res.status);
            let user: UserResponse | null = null;
            try {
              user = (await res.json()) as UserResponse;
            } catch (e) {
              console.error('[NextAuth][authorize][signup] JSON parse failed:', e);
            }
            console.log('[NextAuth][authorize][signup] response body:', user);

            if (res.ok && user) {
              return user;
            }
          } catch (error) {
            console.error('[NextAuth][authorize][signup] fetch error:', error);
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
