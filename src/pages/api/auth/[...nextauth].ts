import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/utils/db/prisma';
import bcrypt from 'bcryptjs';

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
          try {
            const user = await prisma.user.findFirst({
              where: {
                OR: [{ email: username }, { username: username }]
              }
            });
            if (user && user.password) {
              const ok = await bcrypt.compare(password, user.password);
              if (ok && user.name && (user.username || user.email)) {
                return {
                  name: user.name,
                  username: user.username ?? user.email ?? '',
                  id: user.id
                } as UserResponse;
              }
            }
          } catch (error) {
            console.error('[NextAuth][authorize][login] db error:', error);
          }
        }

        if (type === 'signup') {
          const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000';
          const signupEndpoint = process.env.NEXTAUTH_SIGNUP || `${base}/api/signup`;
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
              marketingOptIn: (credentials as any)?.marketingOptIn,
              pfDefinition: (credentials as any)?.pfDefinition,
              pjDefinition: (credentials as any)?.pjDefinition,
              // endereço
              addressLabel: (credentials as any)?.addressLabel,
              addressLine1: (credentials as any)?.addressLine1,
              addressLine2: (credentials as any)?.addressLine2,
              StreetNumber: (credentials as any)?.StreetNumber,
              district: (credentials as any)?.district,
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
    signOut: '/login'
  }
};

export default NextAuth(authOptions);
