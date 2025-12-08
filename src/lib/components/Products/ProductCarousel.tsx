import { trpc } from '@/utils/trpc';
import { Title, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons';
import NextError from 'next/error';
import { useRef } from 'react';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { cloudinaryUrl } from '@/utils/client/cloudinaryUrl';
import styles from './ProductCarousel.module.css';

type ProductCarouselProps = {
  title?: string;
  category?: number;
  searchTerm?: string;
  slidesToScroll?: number; // quantidade de cards por clique
};

function ProductCarousel({ title, category, searchTerm, slidesToScroll = 1 }: ProductCarouselProps) {
  const { data, isLoading, error } = trpc.product.sellableProducts.useQuery({
    id: category,
    searchTerm
  });

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    const el = viewportRef.current;
    if (!el) return;
    const cardWidth = 280; // largura do card reduzida
    const gap = 16; // gap horizontal entre cards
    const step = (cardWidth + gap) * slidesToScroll;
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  };

  if (error) {
    return <NextError title={error.message} statusCode={error.data?.httpStatus ?? 500} />;
  }

  return (
    <div className="w-full my-8">
      {title && (
        <div className="flex w-full justify-center min-h-[3rem]">
          <div className="flex flex-col items-center mb-4">
            <Title weight={300} order={2} color="dark" className="text-3xl">
              {title}
            </Title>
          </div>
        </div>
      )}

      <div className={styles.wrapper}>
        <ActionIcon
          variant="filled"
          color="brown"
          radius="xl"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 shadow"
          onClick={() => scroll('left')}
          title="Anterior"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>

        <div
          ref={viewportRef}
          className={`${styles.viewport} scroll-smooth`}
        >
          <div className="flex gap-6 items-stretch">
            {isLoading && Array.from(Array(6).keys()).map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <ProductCardSkeleton />
              </div>
            ))}

            {data &&
              data.map((e, i) => (
                <div key={i} className="flex-shrink-0">
                  <ProductCard
                    id={e.id}
                    title={e.title}
                    description={e.description}
                    price={(+e.priceInCents / 100).toString()}
                    image={cloudinaryUrl(e.image, { transformations: 'f_auto,q_auto' })}
                  />
                </div>
              ))}
          </div>
        </div>

        <ActionIcon
          variant="filled"
          color="brown"
          radius="xl"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 shadow"
          onClick={() => scroll('right')}
          title="Próximo"
        >
          <IconChevronRight size={18} />
        </ActionIcon>
      </div>
    </div>
  );
}

export default ProductCarousel;