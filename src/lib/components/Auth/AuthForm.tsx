import {
  Group,
  Divider,
  Paper,
  createStyles,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Title,
  Select
} from '@mantine/core';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserAuthCheck } from './UserAuthCheck';
import { signIn } from 'next-auth/react';
import { Loader } from '@mantine/core';
import { useState } from 'react';
import { useRouter } from 'next/router';

// Função para aplicar máscara de CPF
const formatCPF = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara XXX.XXX.XXX-XX
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return numbers.replace(/(\d{3})(\d+)/, '$1.$2');
  } else if (numbers.length <= 9) {
    return numbers.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  } else {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
  }
};
// Social auth buttons removed from signup/login UI
import Link from 'next/link';

interface LoginFormProps {
  title: string;
  buttonTitle: string;
  isForSignUp: boolean;
}

let baseSchema = {
  username: z
    .string()
    .min(1, { message: 'Nome de usuário não pode estar vazio' })
    .max(50, { message: 'Nome de usuário deve ter menos de 50 caracteres' }),
  password: z
    .string()
    .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
    .max(64, { message: 'Senha deve ter menos de 64 caracteres' })
};

const loginFormSchema = z.object(baseSchema);
const signupFormSchema = z
  .object({
    accountType: z.enum(['INDIVIDUAL', 'COMPANY']).default('INDIVIDUAL'),
    fullName: z.string().min(1, { message: 'Nome completo não pode estar vazio' }).max(100),
    email: z.string().email({ message: 'Endereço de email inválido' }).max(100),
    mobilePhone: z.string().min(8, { message: 'Celular deve ter pelo menos 8 caracteres' }).max(20),
    // phone removed from signup form
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']).optional(),
    birthDate: z.string().optional(),
    cpf: z.string().min(11, { message: 'CPF deve ter pelo menos 11 caracteres' }).max(14),
    ...baseSchema,
    confirmPassword: z.string().min(8).max(64),
    termsConsent: z.boolean().refine((v) => v === true, { message: 'Você deve aceitar os termos' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  });

type SignUpFormData = z.infer<typeof signupFormSchema>;
type LoginFormData = z.infer<typeof loginFormSchema>;

type FormData = SignUpFormData | LoginFormData;

const useStyles = createStyles((theme) => ({
  wrapper: {
    minHeight: '100vh',
    backgroundSize: 'cover',
    backgroundImage: 'url(/background.jpg)'
  },

  form: {
    // center the form
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    maxWidth: 480,
    width: '100%',
    margin: '40px auto',
    paddingTop: 40,

    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      maxWidth: '100%'
    }
  },

  title: {
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    fontFamily: `Greycliff CF, ${theme.fontFamily}`
  },

  logo: {
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    width: 120,
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto'
  }
}));

export function AuthForm({ title, buttonTitle, isForSignUp }: LoginFormProps) {
  const { classes } = useStyles();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setisLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors }
  } = useForm<SignUpFormData>({
    resolver: zodResolver(isForSignUp ? signupFormSchema : loginFormSchema)
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setMessage('');
    setisLoading(false);
    if (!isForSignUp) {
      setisLoading(true);
      const res = await signIn('credentials', {
        username: data.username,
        password: data.password,
        type: 'login',
        redirect: false
      });

      if (res && res.ok) {
        setMessage('Signed In Successfully, Redirecting...');
        setisLoading(false);
        router.push('/');
      } else {
        setError('Invalid Credentials');
        setisLoading(false);
      }
    } else {
      setisLoading(true);
      
      // Chamada direta para API de signup em vez de usar NextAuth
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountType: (data as any).accountType,
          fullName: (data as any).fullName,
          email: (data as any).email,
          mobilePhone: (data as any).mobilePhone,
          gender: (data as any).gender,
          birthDate: (data as any).birthDate,
          cpf: (data as any).cpf,
          username: (data as any).username,
          password: (data as any).password,
          confirmPassword: (data as any).confirmPassword,
          termsConsent: (data as any).termsConsent,
        }),
      });

      const result = await res.json();

      if (res.ok && result.id) {
        setMessage('Conta criada com sucesso! Redirecionando...');
        setisLoading(false);
        // Após criar a conta, fazer login automaticamente
        const loginRes = await signIn('credentials', {
          username: (data as any).username,
          password: (data as any).password,
          type: 'login',
          redirect: false
        });
        
        if (loginRes && loginRes.ok) {
          router.push('/');
        } else {
          router.push('/login');
        }
      } else {
        setError(result.message || 'Erro ao criar conta');
        setisLoading(false);
      }
    }
  };

  let signupInputs;
  let loginExistense;

  if (isForSignUp) {
    signupInputs = (
      <>
        <Controller
          name="accountType"
          control={control}
          defaultValue="INDIVIDUAL"
          render={({ field }) => (
            <Select
              data={[
                { value: 'INDIVIDUAL', label: 'Pessoa Física' },
                { value: 'COMPANY', label: 'Pessoa Jurídica' }
              ]}
              {...field}
              label="Tipo de conta"
              placeholder="Selecione o tipo"
              size="md"
            />
          )}
        />
        <TextInput {...register('fullName')} label="Nome completo" placeholder="Digite seu nome completo" size="md" />
        {errors?.fullName?.message && <span className="text-red-700">ⓘ {errors.fullName?.message}</span>}
        <TextInput {...register('email')} label="E-mail" placeholder="Digite seu e-mail" mt="md" size="md" />
        {errors?.email?.message && <span className="text-red-700">ⓘ {errors.email?.message}</span>}
        <TextInput {...register('mobilePhone')} label="Celular" placeholder="DDD + Celular" mt="md" size="md" />
        {errors?.mobilePhone?.message && <span className="text-red-700">ⓘ {errors.mobilePhone?.message}</span>}
        {/* Phone (optional) removed */}
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select
              data={[
                { value: 'MALE', label: 'Masculino' },
                { value: 'FEMALE', label: 'Feminino' },
                { value: 'OTHER', label: 'Outro' },
                { value: 'UNDISCLOSED', label: 'Prefiro não informar' }
              ]}
              {...field}
              label="Gênero (opcional)"
              placeholder="Escolha o gênero"
              mt="md"
              size="md"
            />
          )}
        />
        <TextInput {...register('birthDate')} label="Data de nascimento (opcional)" placeholder="DD/MM/AAAA" mt="md" size="md" />
        <TextInput 
          {...register('cpf')} 
          label="CPF" 
          placeholder="000.000.000-00" 
          mt="md" 
          size="md"
          onChange={(e) => {
            const formatted = formatCPF(e.target.value);
            e.target.value = formatted;
            // Atualiza o valor no react-hook-form
            const { onChange } = register('cpf');
            onChange(e);
          }}
        />
        {errors?.cpf?.message && <span className="text-red-700">ⓘ {errors.cpf?.message}</span>}
      </>
    );
    loginExistense = (
      <UserAuthCheck message="Já tem uma conta?" action="Entrar" link="/login" />
    );
  } else {
    loginExistense = (
      <UserAuthCheck message={"Não tem uma conta?"} action="Cadastrar" link="/signup" />
    );
  }

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        <Title order={2} className={classes.title} align="center" mt="md" mb={50}>
          <Link href="/">
            <Image src="/logo.jpeg" alt="Logo" width={160} height={48} />
          </Link>
        </Title>

        {/* Social login removed; proceeding with email/username form only */}

        <form onSubmit={handleSubmit(onSubmit)}>
          {signupInputs}
          <TextInput
            {...register('username')}
            label="Nome de usuário"
            placeholder="Nome de usuário"
            mt="md"
            size="md"
          />
          {errors.username?.message && (
            <span className="text-red-700">ⓘ {errors.username?.message}</span>
          )}
          <PasswordInput
            {...register('password')}
            label="Senha"
            placeholder="Sua senha"
            mt="md"
            size="md"
          />
          {errors.password?.message && (
            <span className="text-red-700">ⓘ {errors.password?.message}</span>
          )}
          {isForSignUp && (
            <>
              <PasswordInput
                {...register('confirmPassword')}
                label="Confirmar senha"
                placeholder="Confirme sua senha"
                mt="md"
                size="md"
              />
              {errors && (errors as any).confirmPassword?.message && (
                <span className="text-red-700">ⓘ {(errors as any).confirmPassword?.message as string}</span>
              )}
              <Checkbox {...register('termsConsent')} label="Concordo com os termos e condições" mt="md" size="md" />
            </>
          )}
          <Checkbox label="Manter-me conectado" mt="xl" size="md" />
          <Button type="submit" className="bg-black hover:bg-slate-800" fullWidth mt="xl" size="md">
            {isLoading ? <Loader color="white" variant="dots" /> : buttonTitle}
          </Button>
        </form>
        {loginExistense}
      </Paper>
    </div>
  );
}
