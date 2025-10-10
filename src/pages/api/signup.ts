import { NextApiResponse, NextApiRequest } from 'next';
import { prisma } from '@/utils/db/prisma';
import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import * as z from 'zod';

// Validação de CPF (remoção de não dígitos e cálculo dos dígitos verificadores)
const isValidCPF = (value: string) => {
  const cpf = (value || '').replace(/\D/g, '');
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10), 10);
};

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
      .max(100, { message: 'E-mail muito longo' })
      .email('E-mail inválido'),
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
    marketingOptIn: z.boolean().optional(),
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
    // Endereço inicial
    addressLabel: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    StreetNumber: z.string().optional(),
    district: z.string().optional(),
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
  )
  .superRefine((data, ctx) => {
    // Validações adicionais por perfil conforme telas
    if (data.personType === 'PF') {
      if (!data.name) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Nome completo é obrigatório' });
      }
      if (!data.cpf) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cpf'], message: 'CPF é obrigatório' });
      } else if (!isValidCPF(data.cpf)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cpf'], message: 'CPF inválido' });
      }
      if (!data.birthDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['birthDate'], message: 'Data de nascimento é obrigatória' });
      }
      if (!data.gender) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['gender'], message: 'Sexo é obrigatório' });
      }
      if (!data.phone) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Telefone é obrigatório' });
      }
      if (!data.pfDefinition) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pfDefinition'], message: 'Selecione o que te define melhor' });
      }
      // Endereço obrigatório
      if (!data.addressLabel) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['addressLabel'], message: 'Nome identificador é obrigatório' });
      }
      if (!data.postalCode) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['postalCode'], message: 'CEP é obrigatório' });
      } else if (!/^\d{5}-?\d{3}$/.test(data.postalCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['postalCode'], message: 'CEP inválido' });
      }
      if (!data.addressLine1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['addressLine1'], message: 'Endereço é obrigatório' });
      }
      if (!data.StreetNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['StreetNumber'], message: 'Número é obrigatório' });
      }
      if (!data.district) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['district'], message: 'Bairro é obrigatório' });
      }
      if (!data.region) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['region'], message: 'Estado é obrigatório' });
      }
      if (!data.city) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['city'], message: 'Cidade é obrigatória' });
      }
    }
    if (data.personType === 'PJ') {
      if (!data.companyName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['companyName'], message: 'Razão social é obrigatória' });
      }
      if (!data.cnpj) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cnpj'], message: 'CNPJ é obrigatório' });
      }
    }

    // Endereço mínimo: se houver addressLine1, exigir cidade e estado
    if (data.addressLine1) {
      if (!data.city) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['city'], message: 'Cidade é obrigatória' });
      }
      if (!data.region) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['region'], message: 'Estado é obrigatório' });
      }
    }

    if (data.personType === 'PJ') {
      if (!data.companyName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['companyName'], message: 'Razão social é obrigatória' });
      }
      if (!data.tradeName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tradeName'], message: 'Nome fantasia é obrigatório' });
      }
      if (!data.cnpj) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cnpj'], message: 'CNPJ é obrigatório' });
      }
      if (!data.whatsapp) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['whatsapp'], message: 'WhatsApp é obrigatório' });
      }
      if (!data.pjDefinition) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pjDefinition'], message: 'Selecione o que te define melhor' });
      }
      // IE obrigatório exceto quando Isento
      if (!data.stateRegistrationIsento && !data.stateRegistration) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['stateRegistration'], message: 'Inscrição estadual é obrigatória (ou marque Isento)' });
      }
      // Dados pessoais do responsável
      if (!data.name) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Nome completo é obrigatório' });
      }
      if (!data.birthDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['birthDate'], message: 'Data de nascimento é obrigatória' });
      }
      if (!data.gender) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['gender'], message: 'Sexo é obrigatório' });
      }
      // Endereço obrigatório
      if (!data.addressLabel) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['addressLabel'], message: 'Nome identificador é obrigatório' });
      }
      if (!data.postalCode) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['postalCode'], message: 'CEP é obrigatório' });
      }
      if (!data.addressLine1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['addressLine1'], message: 'Endereço é obrigatório' });
      }
      if (!data.StreetNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['StreetNumber'], message: 'Número é obrigatório' });
      }
      if (!data.district) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['district'], message: 'Bairro é obrigatório' });
      }
      if (!data.region) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['region'], message: 'Estado é obrigatório' });
      }
      if (!data.city) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['city'], message: 'Cidade é obrigatória' });
      }
    }
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
  const marketingOptIn = parse.data.marketingOptIn;
  const pfDefinition = parse.data.pfDefinition;
  const pjDefinition = parse.data.pjDefinition;
  const addressLabel = parse.data.addressLabel;
  const addressLine1 = parse.data.addressLine1;
  const addressLine2 = parse.data.addressLine2;
  const StreetNumber = parse.data.StreetNumber;
  const district = parse.data.district;
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

    const parsedBirthDate = birthDate && /^(\d{2})\/(\d{2})\/(\d{4})$/.test(birthDate)
      ? new Date(`${birthDate.slice(6, 10)}-${birthDate.slice(3, 5)}-${birthDate.slice(0, 2)}`)
      : (birthDate ? new Date(birthDate) : undefined);

    const newUser = await prisma.user.create({
      data: ({
        name: name,
        username: username, // manter compatibilidade
        email: username,
        password: hash,
        personType: personType as any,
        cpf: cpf || undefined,
        cnpj: cnpj || undefined,
        birthDate: parsedBirthDate,
        gender: gender || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        companyName: companyName || undefined,
        tradeName: tradeName || undefined,
        stateRegistration: stateRegistration || undefined,
        stateRegistrationIsento: stateRegistrationIsento ?? undefined,
        alternatePhone: alternatePhone || undefined,
        marketingOptIn: marketingOptIn ?? undefined,
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
                      district: district || undefined,
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
