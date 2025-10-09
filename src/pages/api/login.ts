import { NextApiResponse, NextApiRequest } from 'next';
import { prisma } from '@/utils/db/prisma';
import argon2 from 'argon2';
import * as z from 'zod';

const credentials = z.object({
  username: z
    .string()
    .min(1, { message: 'Username cannot be empty' })
    .max(50, { message: 'Username should be under 50 characters' }),
  password: z
    .string()
    .min(8, { message: 'Password should be at least 8 characters' })
    .max(64, { message: 'Password should be under 64 characters' })
});

type Credentials = z.infer<typeof credentials>;

type CredentialsResponse = {
  name: string;
  username: string;
  id: string;
};

type ErrorResponse = {
  message: string;
};

type LogInResponse = CredentialsResponse | ErrorResponse;

export default async function handler(req: NextApiRequest, res: NextApiResponse<LogInResponse>) {
  console.log('[api/login] method:', req.method);
  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'method not allowed' });
  }

  const userCredentials: Credentials = req.body;
  console.log('[api/login] body (sanitized):', { username: (userCredentials as any)?.username });
  const parse = credentials.safeParse(userCredentials);

  if (!parse.success) {
    console.warn('[api/login] zod parse fail:', parse.error?.errors?.map((e) => e.message));
    return res.status(400).json({ message: 'Something wrong with your input' });
  }

  const username = parse.data.username;
  const password = parse.data.password;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username
      }
    });
    console.log('[api/login] user lookup:', user ? 'FOUND' : 'NOT_FOUND');

    if (user && user.password) {
      const verified = await argon2.verify(user.password, password);
      console.log('[api/login] password verify:', verified ? 'OK' : 'FAILED');
      if (verified) {
        if (user.name && user.username) {
          console.log('[api/login] login success:', { id: user.id, username: user.username });
          return res.status(200).json({
            name: user.name,
            username: user.username,
            id: user.id
          });
        }
      } else {
        console.warn('[api/login] invalid credentials for username:', username);
        return res.status(409).json({ message: 'Invalid Credentials' });
      }
    }

    console.warn('[api/login] no such user for username:', username);
    return res.status(500).json({ message: 'No Such User' });
  } catch (error) {
    console.error('[api/login] unexpected error:', error);
    return res.status(500).json({ message: 'An Error Occured' });
  }
}
