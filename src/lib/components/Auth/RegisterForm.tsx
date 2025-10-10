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

const cpfSchema = z.object({
  name: z.string().min(1, { message: 'Informe seu nome' }),
  email: z.string().min(1, { message: 'Informe o e-mail' }),
  confirmEmail: z.string().min(1, { message: 'Confirme o e-mail' }),
  password: z.string().min(8, { message: 'Mínimo de 8 caracteres' }),
  confirmPassword: z.string(),
  cpf: z.string().min(11, { message: 'CPF inválido' }),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  alternatePhone: z.string().optional(),
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
  ]).optional(),
  // endereço
  addressLabel: z.string().optional(),
  postalCode: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  addressLine1: z.string().optional(),
  StreetNumber: z.string().optional(),
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
  tradeName: z.string().optional(),
  email: z.string().min(1, { message: 'Informe o e-mail' }),
  confirmEmail: z.string().min(1, { message: 'Confirme o e-mail' }),
  password: z.string().min(8, { message: 'Mínimo de 8 caracteres' }),
  confirmPassword: z.string(),
  cnpj: z.string().min(14, { message: 'CNPJ inválido' }),
  stateRegistration: z.string().optional(),
  stateRegistrationIsento: z.boolean().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
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
  ]).optional(),
  // endereço
  addressLabel: z.string().optional(),
  postalCode: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  addressLine1: z.string().optional(),
  StreetNumber: z.string().optional(),
  addressLine2: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
}).refine((data) => data.email === data.confirmEmail, {
  message: 'E-mails não coincidem',
  path: ['confirmEmail']
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
    const res = await signIn('credentials', {
      name: data.name,
      username: data.email,
      password: data.password,
      personType: 'PF',
      cpf: data.cpf,
      birthDate: data.birthDate,
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
      name: data.companyName,
      username: data.email,
      password: data.password,
      personType: 'PJ',
      cnpj: data.cnpj,
      companyName: data.companyName,
      tradeName: data.tradeName,
      stateRegistration: data.stateRegistration,
      stateRegistrationIsento: data.stateRegistrationIsento,
      phone: data.phone,
      whatsapp: data.whatsapp,
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
                  <TextInput {...cnpjForm.register('companyName')} label="Razão Social" placeholder="Razão Social" />
                  {cnpjForm.formState.errors.companyName?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.companyName?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('tradeName')} label="Nome Fantasia" placeholder="Nome Fantasia" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('cnpj')} label="CNPJ" placeholder="00.000.000/0000-00" />
                  {cnpjForm.formState.errors.cnpj?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.cnpj?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('stateRegistration')} label="Inscrição Estadual" placeholder="IE" />
                  <Checkbox mt="xs" label="Isento" {...cnpjForm.register('stateRegistrationIsento')} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('email')} label="E-mail" placeholder="email@empresa.com" />
                  <TextInput {...cnpjForm.register('confirmEmail')} label="Confirmar e-mail" placeholder="email@empresa.com" />
                  {cnpjForm.formState.errors.email?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.email?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('phone')} label="Telefone" placeholder="(xx) xxxxx-xxxx" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput {...cnpjForm.register('password')} label="Senha" placeholder="Crie uma senha" />
                  {cnpjForm.formState.errors.password?.message && (
                    <span className="text-red-700">ⓘ {cnpjForm.formState.errors.password?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput {...cnpjForm.register('confirmPassword')} label="Confirmar senha" placeholder="Repita a senha" />
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
                        value={field.value ?? null}
                        onChange={(val) => field.onChange(val)}
                        clearable
                      />
                    )}
                  />
                </Grid.Col>
                <Grid.Col span={12}><Divider my="md" label="Endereço" labelPosition="center" /></Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('addressLabel')} label="Nome identificador" placeholder="Ex: Casa, Trabalho" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('postalCode')} label="CEP" placeholder="00000-000" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('addressLine1')} label="Endereço" placeholder="Rua" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('StreetNumber')} label="Número" placeholder="Número" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('addressLine2')} label="Complemento" placeholder="Bloco, apto" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('city')} label="Bairro" placeholder="Bairro" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('region')} label="Estado" placeholder="Estado" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cnpjForm.register('city')} label="Cidade" placeholder="Cidade" />
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
                  <TextInput {...cpfForm.register('name')} label="Nome" placeholder="Seu nome" />
                  {cpfForm.formState.errors.name?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.name?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('cpf')} label="CPF" placeholder="000.000.000-00" />
                  {cpfForm.formState.errors.cpf?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.cpf?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('email')} label="E-mail" placeholder="seu@email.com" />
                  <TextInput {...cpfForm.register('confirmEmail')} label="Confirmar e-mail" placeholder="seu@email.com" />
                  {cpfForm.formState.errors.email?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.email?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('phone')} label="Telefone" placeholder="(xx) xxxxx-xxxx" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput {...cpfForm.register('password')} label="Senha" placeholder="Crie uma senha" />
                  {cpfForm.formState.errors.password?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.password?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput {...cpfForm.register('confirmPassword')} label="Confirmar senha" placeholder="Repita a senha" />
                  {cpfForm.formState.errors.confirmPassword?.message && (
                    <span className="text-red-700">ⓘ {cpfForm.formState.errors.confirmPassword?.message}</span>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('whatsapp')} label="WhatsApp" placeholder="(xx) xxxxx-xxxx" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('gender')} label="Gênero" placeholder="Opcional" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('alternatePhone')} label="Telefone alternativo" placeholder="(xx) xxxxx-xxxx" />
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
                        clearable
                      />
                    )}
                  />
                </Grid.Col>
                <Grid.Col span={12}><Divider my="md" label="Endereço" labelPosition="center" /></Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('addressLabel')} label="Nome identificador" placeholder="Ex: Casa, Trabalho" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('postalCode')} label="CEP" placeholder="00000-000" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('addressLine1')} label="Endereço" placeholder="Rua" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('StreetNumber')} label="Número" placeholder="Número" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('addressLine2')} label="Complemento" placeholder="Bloco, apto" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('city')} label="Bairro" placeholder="Bairro" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('region')} label="Estado" placeholder="Estado" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput {...cpfForm.register('city')} label="Cidade" placeholder="Cidade" />
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