import Head from 'next/head';
import { PageWithLayout } from '@/lib/types/page';
import { ReactElement } from 'react';
import AuthLayout from '@/lib/components/Layouts/AuthLayout';
import RegisterForm from '@/lib/components/Auth/RegisterForm';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, res } = ctx;
  const session = await unstable_getServerSession(req, res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    };
  }

  return {
    props: {}
  };
};

const SignUp: PageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Signup • Zavy</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <RegisterForm />
    </>
  );
};

SignUp.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default SignUp;
