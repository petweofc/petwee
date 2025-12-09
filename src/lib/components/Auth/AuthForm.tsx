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
  Alert
} from '@mantine/core';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserAuthCheck } from './UserAuthCheck';
import { signIn } from 'next-auth/react';
import { Loader } from '@mantine/core';
import { useState } from 'react';
import { useRouter } from 'next/router';

// Social auth buttons removed from signup/login UI
import Link from 'next/link';
import { GoogleButton, FacebookButton } from '@/lib/components/Buttons/AuthButtons';

interface LoginFormProps {
  title: string;
  buttonTitle: string;
  isForSignUp: boolean;
}

let baseSchema = {
  username: z
    .string()
    .min(1, { message: 'E-mail não pode ser vazio' })
    .max(100, { message: 'E-mail muito longo' }),
  password: z
    .string()
    .min(8, { message: 'Senha deve ter ao menos 8 caracteres' })
    .max(64, { message: 'Senha muito longa' })
};

const loginFormSchema = z.object(baseSchema);
const signupFormSchema = z.object({
  name: z.string().min(1, { message: 'Nome não pode estar vazio' }).max(100),
  ...baseSchema,
  confirmPassword: z.string().optional(),
  termsConsent: z.boolean().optional()
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
      // Pré-validação para trazer mensagens específicas do backend
      try {
        const check = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: data.username, password: data.password })
        });
        const payload = await check.json().catch(() => ({}));

        if (check.status === 200) {
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
            setError('Erro ao autenticar. Tente novamente.');
            setisLoading(false);
          }
        } else if (check.status === 409) {
          setError('Credenciais inválidas. Verifique usuário e senha.');
          setisLoading(false);
        } else if (check.status === 400) {
          setError('Entrada inválida. Corrija os campos e tente novamente.');
          setisLoading(false);
        } else if (check.status === 500) {
          // Backend usa 500 para usuário inexistente
          setError('Usuário não encontrado.');
          setisLoading(false);
        } else {
          setError((payload as any)?.message || 'Erro inesperado ao fazer login.');
          setisLoading(false);
        }
      } catch (e) {
        setError('Falha de conexão com o servidor.');
        setisLoading(false);
      }
    } else {
      setisLoading(true);
      try {
        const check = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: (data as any).name,
            username: data.username,
            password: data.password
          })
        });
        const payload = await check.json().catch(() => ({}));

        if (check.status === 200) {
          setMessage('Conta criada com sucesso! Redirecionando...');
          setisLoading(false);
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
          setError((payload as any)?.message || 'Erro ao criar conta. Verifique os dados.');
          setisLoading(false);
        }
      } catch (e) {
        setError('Falha de conexão com o servidor.');
        setisLoading(false);
      }
    }
  };

  let signupInputs;
  let loginExistense;

  if (isForSignUp) {
    signupInputs = (
      <>
        <TextInput {...register('name')} label="Nome" placeholder="Seu nome" size="md" />
        {errors && (errors as any).name?.message && (
          <span className="text-red-700">ⓘ {(errors as any).name?.message as string}</span>
        )}
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
 
        <Group grow mb="md" mt="md">
          <GoogleButton onClick={() => signIn('google')} radius="xl">
            Google
          </GoogleButton>
          <FacebookButton onClick={() => signIn('facebook')} radius="xl">
            Facebook
          </FacebookButton>
        </Group>

        <Divider label="Ou entre com e-mail" labelPosition="center" my="lg" />
 

        <form onSubmit={handleSubmit(onSubmit)}>
          {signupInputs}
          <TextInput
            {...register('username')}
            label="E-mail"
            placeholder="seu@email.com"
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
 
          <div className="mt-2 mb-2 text-right">
            <Link href="/" className="text-blue-700 text-sm">Esqueci minha senha</Link>
          </div>
 
          <Checkbox label="Manter-me conectado" mt="xl" size="md" />
          <Button type="submit" className="bg-black hover:bg-slate-800" fullWidth mt="xl" size="md">
            {isLoading ? <Loader color="white" variant="dots" /> : buttonTitle}
          </Button>
        </form>
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
        {loginExistense}
      </Paper>
    </div>
  );
}
