import React, { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons';

type Slide = {
  imageUrl: string;
  alt: string;
  href?: string;
};

type BannerCarouselProps = {
  slides?: Slide[];
  height?: number; // in px
  autoPlayDelayMs?: number;
};

const defaultSlides: Slide[] = [
  {
    imageUrl: 'https://placehold.co/1600x360/0c7/fff?text=Frete+Gr%C3%A1tis+%7C+Pedidos+%3E+R%24250',
    alt: 'Frete Grátis'
  },
  {
    imageUrl: 'https://placehold.co/1600x360/07a/fff?text=Novidades+para+Pets',
    alt: 'Novidades'
  },
  {
    imageUrl: 'https://placehold.co/1600x360/b60/fff?text=Promo%C3%A7%C3%B5es+da+Semana',
    alt: 'Promoções'
  },
  {
    imageUrl: 'https://placehold.co/1600x360/333/fff?text=Cuidados+e+Higiene+Pet',
    alt: 'Cuidados Pet'
  }
];

export default function BannerCarousel({
  slides = defaultSlides,
  height = 280,
  autoPlayDelayMs = 4000
}: BannerCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: autoPlayDelayMs })
  ]);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  useEffect(() => {
    if (!emblaApi) return;
  }, [emblaApi]);

  return (
    <div className="w-full mb-6">
      <div className="w-full relative">
        <div className="embla overflow-hidden rounded-lg" ref={emblaRef}>
          <div className="embla__container flex">
            {slides.map((slide, idx) => (
              <div key={idx} className="embla__slide min-w-0 flex-[0_0_100%] relative">
                {slide.href ? (
                  <a href={slide.href} aria-label={slide.alt}>
                    <img
                      src={slide.imageUrl}
                      alt={slide.alt}
                      style={{ height, width: '100%', objectFit: 'cover' }}
                    />
                  </a>
                ) : (
                  <img
                    src={slide.imageUrl}
                    alt={slide.alt}
                    style={{ height, width: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Anterior"
          onClick={scrollPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2"
        >
          <IconChevronLeft size={24} />
        </button>

        <button
          type="button"
          aria-label="Próximo"
          onClick={scrollNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2"
        >
          <IconChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}