import Head from 'next/head';
import { PageWithLayout } from '@/lib/types/page';
import { ReactElement } from 'react';
import Layout from '@/lib/components/Layouts/Layout';
import { useSession, signOut } from 'next-auth/react';
import ProductCards from '@/lib/components/Products/ProductCards';
import Carousel from '@/lib/components/Core/Carousel';

const Home: PageWithLayout = () => {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen min-w-full text-white">
      <Head>
        <title>Zavy</title>
        <meta name="description" content="An ecommerce store" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      
      <div className="mb-8">
        <Carousel />
      </div>
      
      <div className="p-6">
        <ProductCards />
      </div>
    </div>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Home;
