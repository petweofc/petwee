import { NextApiResponse, NextApiRequest } from 'next';
import { prisma } from '@/utils/db/prisma';
import bcrypt from 'bcryptjs';
import * as z from 'zod';

const credentials = z.object({
  // Agora aceitamos e-mail OU username no mesmo campo
  username: z
    .string()
    .min(1, { message: 'E-mail ou usuário não pode ser vazio' })
    .max(100, { message: 'E-mail/usuário muito longo' }),
  password: z
    .string()
    .min(8, { message: 'Senha deve ter ao menos 8 caracteres' })
    .max(64, { message: 'Senha muito longa' })
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
    // Procura por e-mail OU por username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: username }, { username: username }]
      }
    });
    console.log('[api/login] user lookup:', user ? 'FOUND' : 'NOT_FOUND');

    if (user && user.password) {
      const verified = await argon2.verify(user.password, password);
      console.log('[api/login] password verify:', verified ? 'OK' : 'FAILED');
      if (verified) {
        if (user.name && (user.username || user.email)) {
          console.log('[api/login] login success:', { id: user.id, username: user.username });
          return res.status(200).json({
            name: user.name,
            username: user.username ?? user.email ?? '',
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
