import { NextApiResponse, NextApiRequest } from 'next';
import { prisma } from '@/utils/db/prisma';
import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import * as z from 'zod';

// Permite cadastro PF/PJ. "username" seguirá sendo o e-mail para compatibilidade.
const credentials = z
  .object({
    name: z
      .string()
      .min(1, { message: 'O nome não pode estar vazio' })
      .max(50, { message: 'O nome deve ter menos de 50 caracteres' }),
    username: z
      .string()
      .min(1, { message: 'E-mail não pode estar vazio' })
      .max(100, { message: 'E-mail muito longo' }),
    password: z
      .string()
      .min(8, { message: 'A senha deve ter ao menos 8 caracteres' })
      .max(64, { message: 'Senha muito longa' }),
    personType: z.enum(['PF', 'PJ']).optional(),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    birthDate: z.string().optional(),
    gender: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    companyName: z.string().optional(),
    tradeName: z.string().optional(),
    stateRegistration: z.string().optional(),
    stateRegistrationIsento: z.boolean().optional(),
    alternatePhone: z.string().optional(),
    pfDefinition: z
      .enum([
        'PETSHOP',
        'BANHO_TOSA',
        'CLINICA_VETERINARIA',
        'PENSANDO_NEGOCIO',
        'VENDAS_ONLINE',
        'OUTRO_RAMO',
        'CONSUMIDOR_FINAL',
        'VENDEDOR_REPRESENTANTE',
        'DROPSHIPPING'
      ])
      .optional(),
    pjDefinition: z
      .enum([
        'PETSHOP',
        'BANHO_TOSA',
        'CLINICA_VETERINARIA',
        'PENSANDO_NEGOCIO',
        'VENDAS_ONLINE',
        'OUTRO_RAMO',
        'CONSUMIDOR_FINAL',
        'VENDEDOR_REPRESENTANTE',
        'DROPSHIPPING'
      ])
      .optional(),
    // Endereço inicial (opcional)
    addressLabel: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    StreetNumber: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.personType === 'PF') {
        return !!data.cpf;
      }
      if (data.personType === 'PJ') {
        return !!data.cnpj;
      }
      return true; // se não informado, mantém compatibilidade
    },
    {
      message: 'Informe CPF para PF ou CNPJ para PJ',
      path: ['cpf']
    }
  );

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
  console.log('[api/signup] body (sanitized):', {
    username: (userCredentials as any)?.username,
    name: (userCredentials as any)?.name,
    personType: (userCredentials as any)?.personType
  });
  const parse = credentials.safeParse(userCredentials);

  if (!parse.success) {
    console.warn('[api/signup] zod parse fail:', parse.error?.errors?.map((e) => e.message));
    return res.status(400).json({ message: 'Something wrong with your input' });
  }

  const name = parse.data.name;
  const username = parse.data.username;
  const password = parse.data.password;
  const personType = parse.data.personType;
  const cpf = parse.data.cpf;
  const cnpj = parse.data.cnpj;
  const birthDate = parse.data.birthDate;
  const gender = parse.data.gender;
  const phone = parse.data.phone;
  const whatsapp = parse.data.whatsapp;
  const companyName = parse.data.companyName;
  const tradeName = parse.data.tradeName;
  const stateRegistration = parse.data.stateRegistration;
  const stateRegistrationIsento = parse.data.stateRegistrationIsento;
  const alternatePhone = parse.data.alternatePhone;
  const pfDefinition = parse.data.pfDefinition;
  const pjDefinition = parse.data.pjDefinition;
  const addressLabel = parse.data.addressLabel;
  const addressLine1 = parse.data.addressLine1;
  const addressLine2 = parse.data.addressLine2;
  const StreetNumber = parse.data.StreetNumber;
  const city = parse.data.city;
  const postalCode = parse.data.postalCode;
  const region = parse.data.region;
  const country = parse.data.country;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }]
      }
    });

    if (user) {
      console.warn('[api/signup] username already exists:', username);
      return res.status(409).json({ message: 'This username already exists' });
    }

    const hash = await argon2.hash(password);
    console.log('[api/signup] password hashed');

    const newUser = await prisma.user.create({
      data: ({
        name: name,
        username: username, // manter compatibilidade
        email: username,
        password: hash,
        personType: personType as any,
        cpf: cpf || undefined,
        cnpj: cnpj || undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        gender: gender || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        companyName: companyName || undefined,
        tradeName: tradeName || undefined,
        stateRegistration: stateRegistration || undefined,
        stateRegistrationIsento: stateRegistrationIsento ?? undefined,
        alternatePhone: alternatePhone || undefined,
        pfDefinition: pfDefinition ? (pfDefinition as any) : undefined,
        pjDefinition: pjDefinition ? (pjDefinition as any) : undefined,
        buyer: {
          create: {
            addresses:
              addressLine1
                ? {
                    create: ({
                      isDefault: true,
                      label: addressLabel || undefined,
                      addressLine1: addressLine1,
                      addressLine2: addressLine2 || undefined,
                      StreetNumber: StreetNumber || undefined,
                      city: city || 'Cidade',
                      postalCode: postalCode || undefined,
                      region: region || 'Estado',
                      country: country || 'Brasil'
                    } as any)
                  }
                : undefined
          }
        }
      } as any)
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

    if (newUser.name && (newUser.username || newUser.email)) {
      return res.status(200).json({
        id: newUser.id,
        name: newUser.name,
        username: newUser.username ?? newUser.email ?? ''
      });
    }

    console.error('[api/signup] unexpected: user created but name/username missing');
    return res.status(500).json({ message: 'Something went wrong' });
  } catch (error) {
    console.error('[api/signup] unexpected error:', error);
    return res.status(500).json({ message: 'An Error Occured' });
  }
}
