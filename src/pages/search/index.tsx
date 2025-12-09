import { useRouter } from 'next/router';
import Head from 'next/head';
import { PageWithLayout } from '@/lib/types/page';
import { ReactElement } from 'react';
import Layout from '@/lib/components/Layouts/Layout';
import ProductCards from '@/lib/components/Products/ProductCards';

const SearchPage: PageWithLayout = () => {
  const router = useRouter();
  const { q } = router.query;
  const searchQuery = q as string;

  return (
    <div className="p-6 min-h-screen min-w-full text-white">
      <Head>
        <title>Resultados da pesquisa: {searchQuery}</title>
        <meta name="description" content={`Resultados da pesquisa para ${searchQuery}`} />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <h1 className="text-2xl font-bold mb-4">Resultados para: {searchQuery}</h1>
      
      {/* Aqui você pode filtrar os produtos com base na consulta de pesquisa */}
      <ProductCards />
    </div>
  );
};

SearchPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default SearchPage;
