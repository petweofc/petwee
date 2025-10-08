import { NextApiResponse, NextApiRequest } from 'next';
import { prisma } from '@/utils/db/prisma';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import * as z from 'zod';

// Função para converter data brasileira (DD/MM/AAAA) para Date
const parseBrazilianDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  
  // Converte DD/MM/AAAA para AAAA-MM-DD
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  
  return undefined;
};

const credentials = z.object({
  accountType: z.enum(['INDIVIDUAL', 'COMPANY']).default('INDIVIDUAL'),
  fullName: z
    .string()
    .min(1, { message: 'Full name cannot be empty' })
    .max(100, { message: 'Full name should be less than 100 characters' }),
  email: z
    .string()
    .email({ message: 'Invalid email address' })
    .max(100, { message: 'Email should be less than 100 characters' }),
  mobilePhone: z
    .string()
    .min(8, { message: 'Mobile phone should be at least 8 characters' })
    .max(20, { message: 'Mobile phone should be less than 20 characters' }),
  // phone removed from signup
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']).optional(),
  birthDate: z.string().optional(),
  cpf: z.string().min(11, { message: 'CPF deve ter pelo menos 11 caracteres' }).max(14, { message: 'CPF deve ter no máximo 14 caracteres' }),
  username: z
    .string()
    .min(1, { message: 'Username cannot be empty' })
    .max(50, { message: 'Username should be under 50 characters' }),
  password: z
    .string()
    .min(8, { message: 'Password should be at least 8 characters' })
    .max(64, { message: 'Password should be under 64 characters' }),
  confirmPassword: z.string().min(8).max(64),
  termsConsent: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
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
  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'method not allowed' });
  }

  console.log('Signup request body:', req.body);
  const userCredentials: Credentials = req.body;
  const parse = credentials.safeParse(userCredentials);

  if (!parse.success) {
    console.log('Validation error:', parse.error);
    return res.status(400).json({ message: 'Something wrong with your input' });
  }

  const {
    accountType,
    fullName,
    email,
    mobilePhone,
    gender,
    birthDate,
    cpf,
    username,
    password
  } = parse.data;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }, { cpf: cpf }]
      }
    });

    if (user) {
      return res.status(409).json({ message: 'User with same username/email/cpf already exists' });
    }

    const hash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: fullName,
        fullName: fullName,
        email: email,
        mobilePhone: mobilePhone,
        gender: gender,
        birthDate: parseBrazilianDate(birthDate),
        cpf: cpf,
        termsConsent: true,
        accountType: accountType,
        username: username,
        password: hash
      }
    });

    await prisma.account.create({
      data: {
        userId: newUser.id,
        provider: 'credentials',
        providerAccountId: randomUUID(),
        type: 'credentials'
      }
    });

    if (newUser.name && newUser.username) {
      return res.status(200).json({
        id: newUser.id,
        name: newUser.name,
        username: newUser.username
      });
    }

    return res.status(500).json({ message: 'Something went wrong' });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'An Error Occured' });
  }
}
