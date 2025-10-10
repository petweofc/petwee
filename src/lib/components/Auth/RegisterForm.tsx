import {
  Divider,
  Paper,
  createStyles,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Alert,
  Tabs,
  Grid,
  Select,
  Checkbox
} from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { Loader } from '@mantine/core';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const useStyles = createStyles((theme) => ({
  wrapper: {
    minHeight: '100vh',
    backgroundSize: 'cover',
    backgroundImage:
      'url(https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1965&q=80)'
  },
  form: {
    minHeight: '100vh',
    maxWidth: 960,
    paddingTop: 40,
    margin: '0 auto'
  },
  title: {
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    fontFamily: `Greycliff CF, ${theme.fontFamily}`
  }
}));

// Validação de CPF (remoção de não dígitos e cálculo dos dígitos verificadores)
const isValidCPF = (value: string) => {
  const cpf = (value || '').replace(/\D/g, '');
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // inválidos repetidos
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

// Helpers de máscara
const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');
const formatCPF = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  let out = [p1, p2, p3].filter(Boolean).join('.');
  if (p4) out += `-${p4}`;
  return out;
};
const formatCNPJ = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 8);
  const p4 = d.slice(8, 12);
  const p5 = d.slice(12, 14);
  let out = [p1, p2, p3].filter(Boolean).join('.');
  if (p4) out += `/${p4}`;
  if (p5) out += `-${p5}`;
  return out;
};
const formatCEP = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};
const formatPhoneBR = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const formatBirthDate = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

// Integração ViaCEP: busca dados de endereço a partir do CEP
type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
};

async function lookupCEP(cepDigits: string): Promise<ViaCepResponse | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepResponse;
    return data;
  } catch {
    return null;
  }
}

const cpfSchema = z.object({
  name: z.string().min(1, { message: 'Nome completo é obrigatório' }),
  email: z.string().min(1, { message: 'Informe o e-mail' }),
  confirmEmail: z.string().min(1, { message: 'Confirme o e-mail' }),
  password: z.string().min(8, { message: 'Mínimo de 8 caracteres' }),
  confirmPassword: z.string(),
  cpf: z
    .string()
    .min(11, { message: 'CPF inválido' })
    .refine((v) => isValidCPF(v), { message: 'CPF inválido' }),
  birthDate: z
    .string()
    .min(1, { message: 'Data de nascimento é obrigatória' })
    .refine((v) => /^\d{2}\/\d{2}\/\d{4}$/.test(v), { message: 'Use o formato dd/mm/aaaa' }),
  gender: z.enum(['Masculino', 'Feminino'], { required_error: 'Selecione o gênero' }),
  phone: z.string().min(1, { message: 'Telefone é obrigatório' }),
  whatsapp: z.string().optional(),
  alternatePhone: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
  pfDefinition: z.enum([
    'PETSHOP',
    'BANHO_TOSA',
    'CLINICA_VETERINARIA',
    'PENSANDO_NEGOCIO',
    'VENDAS_ONLINE',
    'OUTRO_RAMO',
    'CONSUMIDOR_FINAL',
    'VENDEDOR_REPRESENTANTE',
    'DROPSHIPPING'
  ], { required_error: 'Selecione o que te define melhor' }),
  // endereço
  addressLabel: z.string().min(1, { message: 'Nome identificador é obrigatório' }),
  postalCode: z
    .string()
    .min(1, { message: 'CEP é obrigatório' })
    .refine((v) => /^\d{5}-?\d{3}$/.test(v), { message: 'CEP inválido' }),
  region: z.string().min(1, { message: 'Estado é obrigatório' }),
  district: z.string().min(1, { message: 'Bairro é obrigatório' }),
  city: z.string().min(1, { message: 'Cidade é obrigatória' }),
  addressLine1: z.string().min(1, { message: 'Endereço é obrigatório' }),
  StreetNumber: z.string().min(1, { message: 'Número é obrigatório' }),
  addressLine2: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
}).refine((data) => data.email === data.confirmEmail, {
  message: 'E-mails não coincidem',
  path: ['confirmEmail']
});

const cnpjSchema = z.object({
  companyName: z.string().min(1, { message: 'Razão social é obrigatória' }),
  tradeName: z.string().min(1, { message: 'Nome fantasia é obrigatório' }),
  contactName: z.string().min(1, { message: 'Nome completo é obrigatório' }),
  birthDate: z.string().min(1, { message: 'Data de nascimento é obrigatória' }),
  gender: z.enum(['Masculino', 'Feminino'], { required_error: 'Selecione o gênero' }),
  email: z.string().min(1, { message: 'Informe o e-mail' }),
  confirmEmail: z.string().min(1, { message: 'Confirme o e-mail' }),
  password: z.string().min(8, { message: 'Mínimo de 8 caracteres' }),
  confirmPassword: z.string(),
  cnpj: z.string().min(14, { message: 'CNPJ inválido' }),
  stateRegistration: z.string().optional(),
  stateRegistrationIsento: z.boolean().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().min(1, { message: 'WhatsApp é obrigatório' }),
  alternatePhone: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
  pjDefinition: z.enum([
    'PETSHOP',
    'BANHO_TOSA',
    'CLINICA_VETERINARIA',
    'PENSANDO_NEGOCIO',
    'VENDAS_ONLINE',
    'OUTRO_RAMO',
    'CONSUMIDOR_FINAL',
    'VENDEDOR_REPRESENTANTE',
    'DROPSHIPPING'
  ]),
  // endereço
  addressLabel: z.string().min(1, { message: 'Nome identificador é obrigatório' }),
  postalCode: z.string().min(1, { message: 'CEP é obrigatório' }),
  region: z.string().min(1, { message: 'Estado é obrigatório' }),
  district: z.string().min(1, { message: 'Bairro é obrigatório' }),
  city: z.string().min(1, { message: 'Cidade é obrigatória' }),
  addressLine1: z.string().min(1, { message: 'Endereço é obrigatório' }),
  StreetNumber: z.string().min(1, { message: 'Número é obrigatório' }),
  addressLine2: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
}).refine((data) => data.email === data.confirmEmail, {
  message: 'E-mails não coincidem',
  path: ['confirmEmail']
}).refine((data) => {
  // IE obrigatório, exceto quando marcado Isento
  if (data.stateRegistrationIsento) return true;
  return !!data.stateRegistration && data.stateRegistration.length > 0;
}, {
  message: 'Inscrição estadual é obrigatória (ou marque Isento)',
  path: ['stateRegistration']
});

type CPFFormData = z.infer<typeof cpfSchema>;
type CNPJFormData = z.infer<typeof cnpjSchema>;

export default function RegisterForm() {
  const { classes } = useStyles();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const cpfForm = useForm<CPFFormData>({ resolver: zodResolver(cpfSchema) });
  const cnpjForm = useForm<CNPJFormData>({ resolver: zodResolver(cnpjSchema) });

  const submitCPF = async (data: CPFFormData) => {
    setError('');
    setMessage('');
    setIsLoading(true);
    const parseDate = (d: string) => {
      const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return d;
      return `${m[3]}-${m[2]}-${m[1]}`;
    };
    const res = await signIn('credentials', {
      name: data.name,
      username: data.email,
      password: data.password,
      personType: 'PF',
      cpf: data.cpf,
      birthDate: parseDate(data.birthDate),
      gender: data.gender,
      phone: data.phone,
      whatsapp: data.whatsapp,
      alternatePhone: data.alternatePhone,
      pfDefinition: data.pfDefinition,
      // endereço
      addressLabel: data.addressLabel,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      StreetNumber: data.StreetNumber,
      district: data.district,
      city: data.city,
      postalCode: data.postalCode,
      region: data.region,
      country: 'Brasil',
      type: 'signup',
      redirect: false
    });

    if (res && res.ok) {
      setMessage('Conta criada! Redirecionando...');
      setIsLoading(false);
      router.push('/');
    } else {
      setError('Erro ao criar conta. Verifique os dados.');
      setIsLoading(false);
    }
  };

  const submitCNPJ = async (data: CNPJFormData) => {
    setError('');
    setMessage('');
    setIsLoading(true);
    const res = await signIn('credentials', {
      name: data.contactName,
      username: data.email,
      password: data.password,
      personType: 'PJ',
      cnpj: data.cnpj,
      companyName: data.companyName,
      tradeName: data.tradeName,
      birthDate: data.birthDate,
      gender: data.gender,
      stateRegistration: data.stateRegistration,
      stateRegistrationIsento: data.stateRegistrationIsento,
      phone: data.phone,
      whatsapp: data.whatsapp,
      alternatePhone: data.alternatePhone,
      pjDefinition: data.pjDefinition,
      // endereço
      addressLabel: data.addressLabel,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      StreetNumber: data.StreetNumber,
      city: data.city,
      postalCode: data.postalCode,
      region: data.region,
      country: 'Brasil',
      type: 'signup',
      redirect: false
    });

    if (res && res.ok) {
      setMessage('Conta criada! Redirecionando...');
      setIsLoading(false);
      router.push('/');
    } else {
      setError('Erro ao criar conta. Verifique os dados.');
      setIsLoading(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        <Title order={2} className={classes.title} align="center" mt="md" mb={30}>
          <Link href="/">
            <span className="font-logo text-6xl">Zavy</span>
          </Link>
        </Title>

        <Divider label="Ou cadastre-se com seus dados" labelPosition="center" my="lg" />

        <Tabs defaultValue="pj">
          <Tabs.List grow>
            <Tabs.Tab value="pj">Pessoa jurídica (CNPJ)</Tabs.Tab>
            <Tabs.Tab value="pf">Cadastrar com CPF</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pj" pt="xs">
            <form onSubmit={cnpjForm.handleSubmit(submitCNPJ)}>
              <Grid gutter="md">
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('companyName')} label="Razão Social" placeholder="Razão Social" withAsterisk />
                  {cnpjForm.formState.errors.companyName?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.companyName?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('tradeName')} label="Nome Fantasia" placeholder="Nome Fantasia" withAsterisk />
                  {cnpjForm.formState.errors.tradeName?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.tradeName?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="cnpj"
                    control={cnpjForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="CNPJ"
                        placeholder="00.000.000/0000-00"
                        withAsterisk
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                      />
                    )}
                  />
                  {cnpjForm.formState.errors.cnpj?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.cnpj?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('stateRegistration')} label="Inscrição Estadual" placeholder="IE" withAsterisk />
                  <Checkbox mt="xs" label="Isento" {...cnpjForm.register('stateRegistrationIsento')} />
                  {cnpjForm.formState.errors.stateRegistration?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.stateRegistration?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('contactName')} label="Nome Completo" placeholder="Nome do responsável" withAsterisk />
                  {cnpjForm.formState.errors.contactName?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.contactName?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('birthDate')} label="Data de nascimento" placeholder="AAAA-MM-DD" type="date" withAsterisk />
                  {cnpjForm.formState.errors.birthDate?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.birthDate?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="gender"
                    control={cnpjForm.control}
                    render={({ field }) => (
                      <Select
                        data={['Masculino', 'Feminino']}
                        label="Sexo"
                        placeholder="Selecione"
                        withAsterisk
                        value={field.value ?? null}
                        onChange={(val) => field.onChange(val)}
                        clearable
                      />
                    )}
                  />
                  {cnpjForm.formState.errors.gender?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.gender?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('email')} label="E-mail" placeholder="email@empresa.com" withAsterisk />
                  <TextInput {...cnpjForm.register('confirmEmail')} label="Confirmar e-mail" placeholder="email@empresa.com" withAsterisk />
                  {cnpjForm.formState.errors.email?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.email?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="phone"
                    control={cnpjForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="Telefone"
                        placeholder="(xx) xxxxx-xxxx"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      />
                    )}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="whatsapp"
                    control={cnpjForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="WhatsApp"
                        placeholder="(xx) xxxxx-xxxx"
                        withAsterisk
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      />
                    )}
                  />
                  {cnpjForm.formState.errors.whatsapp?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.whatsapp?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="alternatePhone"
                    control={cnpjForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="Telefone alternativo"
                        placeholder="(xx) xxxxx-xxxx"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      />
                    )}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput {...cnpjForm.register('password')} label="Senha" placeholder="Crie uma senha" withAsterisk />
                  {cnpjForm.formState.errors.password?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.password?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput {...cnpjForm.register('confirmPassword')} label="Confirmar senha" placeholder="Repita a senha" withAsterisk />
                  {cnpjForm.formState.errors.confirmPassword?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.confirmPassword?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={12}>
                  <Controller
                    name="pjDefinition"
                    control={cnpjForm.control}
                    render={({ field }) => (
                      <Select
                        data={[
                          { value: 'PETSHOP', label: 'Tenho um Pet Shop' },
                          { value: 'BANHO_TOSA', label: 'Tenho um Banho e Tosa' },
                          { value: 'CLINICA_VETERINARIA', label: 'Tenho uma Clínica Veterinária' },
                          { value: 'PENSANDO_NEGOCIO', label: 'Estou pensando em montar um negócio' },
                          { value: 'VENDAS_ONLINE', label: 'Faço vendas online' },
                          { value: 'OUTRO_RAMO', label: 'Sou de outro ramo' },
                          { value: 'CONSUMIDOR_FINAL', label: 'Sou consumidor final' },
                          { value: 'VENDEDOR_REPRESENTANTE', label: 'Sou vendedor/representante' },
                          { value: 'DROPSHIPPING', label: 'Faço dropshipping' }
                        ]}
                        label="O que te define melhor?"
                        placeholder="Selecione"
                        withAsterisk
                        value={field.value ?? null}
                        onChange={(val) => field.onChange(val)}
                        clearable
                      />
                    )}
                  />
                </Grid.Col>
                <Grid.Col span={12}><Divider my="md" label="Endereço" labelPosition="center" /></Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('addressLabel')} label="Nome identificador" placeholder="Ex: Casa, Trabalho" withAsterisk />
                  {cnpjForm.formState.errors.addressLabel?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.addressLabel?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="postalCode"
                    control={cnpjForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="CEP"
                        placeholder="00000-000"
                        withAsterisk
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatCEP(e.target.value))}
                        onBlur={async () => {
                          const digits = onlyDigits(field.value ?? '');
                          if (digits.length === 8) {
                            const data = await lookupCEP(digits);
                            if (data && !data.erro) {
                              cnpjForm.setValue('addressLine1', data.logradouro || '');
                              cnpjForm.setValue('district', data.bairro || '');
                              cnpjForm.setValue('city', data.localidade || '');
                              cnpjForm.setValue('region', data.uf || '');
                            }
                          }
                        }}
                      />
                    )}
                  />
                  {cnpjForm.formState.errors.postalCode?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.postalCode?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('addressLine1')} label="Endereço" placeholder="Rua" withAsterisk />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('StreetNumber')} label="Número" placeholder="Número" withAsterisk />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('addressLine2')} label="Complemento" placeholder="Bloco, apto" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('district')} label="Bairro" placeholder="Bairro" withAsterisk />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('region')} label="Estado" placeholder="Estado" withAsterisk />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('city')} label="Cidade" placeholder="Cidade" withAsterisk />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Checkbox mt="xs" label="Desejo receber novidades e promoções" {...cnpjForm.register('marketingOptIn')} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Button type="submit" className="bg-black hover:bg-slate-800" fullWidth mt="md">
                    {isLoading ? <Loader color="white" variant="dots" /> : 'Cadastrar'}
                  </Button>
                </Grid.Col>
              </Grid>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="pf" pt="xs">
            <form onSubmit={cpfForm.handleSubmit(submitCPF)}>
              <Grid gutter="md">
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('name')} label="Nome Completo" placeholder="Nome Completo" withAsterisk />
                  {cpfForm.formState.errors.name?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.name?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="cpf"
                    control={cpfForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="CPF"
                        placeholder="000.000.000-00"
                        withAsterisk
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatCPF(e.target.value))}
                      />
                    )}
                  />
                  {cpfForm.formState.errors.cpf?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.cpf?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="birthDate"
                    control={cpfForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="Data de nascimento"
                        placeholder="dd/mm/aaaa"
                        withAsterisk
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatBirthDate(e.target.value))}
                      />
                    )}
                  />
                  {cpfForm.formState.errors.birthDate?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.birthDate?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('email')} label="E-mail" placeholder="seu@email.com" withAsterisk />
                  <TextInput {...cpfForm.register('confirmEmail')} label="Confirma o e-mail" placeholder="seu@email.com" withAsterisk />
                  {cpfForm.formState.errors.email?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.email?.message}</span>
                  )}
                  {cpfForm.formState.errors.confirmEmail?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.confirmEmail?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="phone"
                    control={cpfForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="Telefone"
                        placeholder="(06) 50000-0004"
                        withAsterisk
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      />
                    )}
                  />
                  {cpfForm.formState.errors.phone?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.phone?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput {...cpfForm.register('password')} label="Senha" placeholder="Crie uma senha" withAsterisk />
                  {cpfForm.formState.errors.password?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.password?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput {...cpfForm.register('confirmPassword')} label="Confirma a senha" placeholder="Repita a senha" withAsterisk />
                  {cpfForm.formState.errors.confirmPassword?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.confirmPassword?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="whatsapp"
                    control={cpfForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="WhatsApp"
                        placeholder="(xx) xxxxx-xxxx"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      />
                    )}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="gender"
                    control={cpfForm.control}
                    render={({ field }) => (
                      <Select
                        data={[
                          { value: 'Masculino', label: 'Masculino' },
                          { value: 'Feminino', label: 'Feminino' }
                        ]}
                        label="Sexo"
                        placeholder="Selecione"
                        withAsterisk
                        value={field.value ?? null}
                        onChange={(val) => field.onChange(val)}
                        clearable={false}
                      />
                    )}
                  />
                  {cpfForm.formState.errors.gender?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.gender?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="alternatePhone"
                    control={cpfForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="Telefone alternativo"
                        placeholder="(xx) xxxxx-xxxx"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      />
                    )}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Controller
                    name="pfDefinition"
                    control={cpfForm.control}
                    render={({ field }) => (
                      <Select
                        data={[
                          { value: 'PETSHOP', label: 'Tenho um Pet Shop' },
                          { value: 'BANHO_TOSA', label: 'Tenho um Banho e Tosa' },
                          { value: 'CLINICA_VETERINARIA', label: 'Tenho uma Clínica Veterinária' },
                          { value: 'PENSANDO_NEGOCIO', label: 'Estou pensando em montar um negócio' },
                          { value: 'VENDAS_ONLINE', label: 'Faço vendas online' },
                          { value: 'OUTRO_RAMO', label: 'Sou de outro ramo' },
                          { value: 'CONSUMIDOR_FINAL', label: 'Sou consumidor final' },
                          { value: 'VENDEDOR_REPRESENTANTE', label: 'Sou vendedor/representante' },
                          { value: 'DROPSHIPPING', label: 'Faço dropshipping' }
                        ]}
                        label="O que te define melhor?"
                        placeholder="Selecione"
                        value={field.value ?? null}
                        onChange={(val) => field.onChange(val)}
                        withAsterisk
                        clearable={false}
                      />
                    )}
                  />
                  {cpfForm.formState.errors.pfDefinition?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.pfDefinition?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={12}><Divider my="md" label="Endereço" labelPosition="center" /></Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('addressLabel')} label="Nome identificador" placeholder="Ex: Casa, Trabalho" withAsterisk />
                  {cpfForm.formState.errors.addressLabel?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.addressLabel?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Controller
                    name="postalCode"
                    control={cpfForm.control}
                    render={({ field }) => (
                      <TextInput
                        label="CEP"
                        placeholder="00000-000"
                        withAsterisk
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatCEP(e.target.value))}
                        onBlur={async () => {
                          const digits = onlyDigits(field.value ?? '');
                          if (digits.length === 8) {
                            const data = await lookupCEP(digits);
                            if (data && !data.erro) {
                              cpfForm.setValue('addressLine1', data.logradouro || '');
                              cpfForm.setValue('district', data.bairro || '');
                              cpfForm.setValue('city', data.localidade || '');
                              cpfForm.setValue('region', data.uf || '');
                            }
                          }
                        }}
                      />
                    )}
                  />
                  {cpfForm.formState.errors.postalCode?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.postalCode?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('addressLine1')} label="Endereço" placeholder="Rua Noruega" withAsterisk />
                  {cpfForm.formState.errors.addressLine1?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.addressLine1?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('StreetNumber')} label="Número" placeholder="Número" withAsterisk />
                  {cpfForm.formState.errors.StreetNumber?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.StreetNumber?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('addressLine2')} label="Complemento" placeholder="Bloco, apto" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('district')} label="Bairro" placeholder="Mucurai" withAsterisk />
                  {cpfForm.formState.errors.district?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.district?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('region')} label="Estado" placeholder="Costa" withAsterisk />
                  {cpfForm.formState.errors.region?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.region?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('city')} label="Cidade" placeholder="Maracenad" withAsterisk />
                  {cpfForm.formState.errors.city?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.city?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={12}>
                  <Checkbox mt="xs" label="Desejo receber novidades e promoções" {...cpfForm.register('marketingOptIn')} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Button type="submit" className="bg-black hover:bg-slate-800" fullWidth mt="md">
                    {isLoading ? <Loader color="white" variant="dots" /> : 'Cadastrar'}
                  </Button>
                </Grid.Col>
              </Grid>
            </form>
          </Tabs.Panel>
        </Tabs>

        {error && (
          <Alert color="red" mt="md">
            {error}
          </Alert>
        )}
        {message && (
          <Alert color="green" mt="md">
            {message}
          </Alert>
        )}
        <div className="mt-2 mb-2 text-center">
          <Link href="/login" className="text-blue-700 text-sm">Já possui conta? Entrar</Link>
        </div>
      </Paper>
    </div>
  );
}