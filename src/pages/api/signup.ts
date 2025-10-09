import { NextApiResponse, NextApiRequest } from 'next';
import { prisma } from '@/utils/db/prisma';
import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import * as z from 'zod';

const credentials = z.object({
  name: z
    .string()
    .min(1, { message: 'Name cannot be empty' })
    .max(50, { message: 'Name should be less than 50 characters' }),
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

type SignUpResponse = CredentialsResponse | ErrorResponse;

export default async function handler(req: NextApiRequest, res: NextApiResponse<SignUpResponse>) {
  console.log('[api/signup] method:', req.method);
  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'method not allowed' });
  }

  const userCredentials: Credentials = req.body;
  console.log('[api/signup] body (sanitized):', { username: (userCredentials as any)?.username, name: (userCredentials as any)?.name });
  const parse = credentials.safeParse(userCredentials);

  if (!parse.success) {
    console.warn('[api/signup] zod parse fail:', parse.error?.errors?.map((e) => e.message));
    return res.status(400).json({ message: 'Something wrong with your input' });
  }

  const name = parse.data.name;
  const username = parse.data.username;
  const password = parse.data.password;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username
      }
    });

    if (user) {
      console.warn('[api/signup] username already exists:', username);
      return res.status(409).json({ message: 'This username already exists' });
    }

    const hash = await argon2.hash(password);
    console.log('[api/signup] password hashed');

    const newUser = await prisma.user.create({
      data: {
        name: name,
        username: username,
        password: hash
      }
    });
    console.log('[api/signup] user created:', { id: newUser.id, username: newUser.username });

    await prisma.account.create({
      data: {
        userId: newUser.id,
        provider: 'credentials',
        providerAccountId: randomUUID(),
        type: 'credentials'
      }
    });
    console.log('[api/signup] credentials account created');

    if (newUser.name && newUser.username) {
      return res.status(200).json({
        id: newUser.id,
        name: newUser.name,
        username: newUser.username
      });
    }

    console.error('[api/signup] unexpected: user created but name/username missing');
    return res.status(500).json({ message: 'Something went wrong' });
  } catch (error) {
    console.error('[api/signup] unexpected error:', error);
    return res.status(500).json({ message: 'An Error Occured' });
  }
}
