import Head from 'next/head';
import { PageWithLayout } from '@/lib/types/page';
import { ReactElement } from 'react';
import Layout from '@/lib/components/Layouts/Layout';
import { useSession, signOut } from 'next-auth/react';
import ProductCards from '@/lib/components/Products/ProductCards';
import BannerCarousel from '@/lib/components/Home/BannerCarousel';

const Home: PageWithLayout = () => {
  const { data: session, status } = useSession();

  return (
    <div className="p-6 min-h-screen min-w-full text-white">
      <Head>
        <title>Zavy</title>
        <meta name="description" content="An ecommerce store" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      {/* Home Banners */}
      <BannerCarousel />

      <ProductCards />
    </div>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Home;
