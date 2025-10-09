import Link from 'next/link';
import { useRef } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandYoutube,
  IconPhone,
  IconMail
} from '@tabler/icons';

const brands = [
  'MyPet',
  'PetLife',
  'Bellos',
  'Petzoo',
  'HappyPet',
  'Doggo',
  'Feline',
  'PetPlus',
  'PetCare',
  'PetWorld'
];

function Footer() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-white border-t mt-10">
      {/* Carrossel de marcas */}
      <div className="relative py-4">
        <div className="relative max-w-[1400px] w-full mx-auto px-4 md:px-6">
          <div
            ref={trackRef}
            className="flex gap-6 justify-center overflow-x-hidden py-2 px-6"
          >
            {brands.map((b, i) => (
              <img
                key={i}
                src={`https://placehold.co/110x40/ffffff/000000?text=${encodeURIComponent(b)}`}
                alt={b}
                className="h-10 w-[110px] rounded shadow-sm border object-contain"
              />
            ))}
          </div>
          <div className="absolute inset-y-0 left-4 hidden lg:flex items-center">
            <button
              onClick={() => scroll(-300)}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border"
              aria-label="Anterior"
            >
              <IconChevronLeft size={16} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-4 hidden lg:flex items-center">
            <button
              onClick={() => scroll(300)}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border"
              aria-label="Próximo"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal do rodapé */}
      <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 py-8 px-4 md:px-6">
        <div>
          <h4 className="text-gray-800 font-medium mb-3">Atendimento ao Cliente</h4>
          <p className="text-sm text-gray-600 mb-3">Estamos aqui para ajudar você.</p>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <IconPhone size={16} /> <span>(11) 0000-0000</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
            <IconMail size={16} /> <span>contato@zavy.com</span>
          </div>
          <button className="mt-4 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm">
            Fale Conosco
          </button>
        </div>

        <div>
          <h4 className="text-gray-800 font-medium mb-3">Bem-vindo à Zavy</h4>
          <p className="text-sm text-gray-600">
            Loja fictícia para demonstração. Você pode adicionar seu texto institucional aqui,
            destacando diferenciais e missão da empresa.
          </p>
          <ul className="mt-3 text-sm text-gray-700 leading-7">
            <li><Link href="#">Como comprar</Link></li>
            <li><Link href="#">Política de trocas</Link></li>
            <li><Link href="#">Frete e prazos</Link></li>
            <li><Link href="#">Perguntas frequentes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gray-800 font-medium mb-3">A empresa</h4>
          <ul className="text-sm text-gray-700 leading-7">
            <li><Link href="#">Quem somos</Link></li>
            <li><Link href="#">Trabalhe conosco</Link></li>
            <li><Link href="#">Parcerias</Link></li>
            <li><Link href="#">Políticas</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gray-800 font-medium mb-3">Catálogo Virtual</h4>
          <img
            src="https://placehold.co/120x160/ffffff/000000?text=Cat%C3%A1logo"
            alt="Catálogo Virtual"
            className="rounded border shadow-sm"
          />
        </div>
      </div>

      {/* Redes sociais */}
      <div className="max-w-[1400px] w-full mx-auto border-t py-4 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Redes Sociais</span>
          <Link href="#" className="text-gray-700 hover:text-gray-900"><IconBrandFacebook size={18} /></Link>
          <Link href="#" className="text-gray-700 hover:text-gray-900"><IconBrandInstagram size={18} /></Link>
          <Link href="#" className="text-gray-700 hover:text-gray-900"><IconBrandTwitter size={18} /></Link>
          <Link href="#" className="text-gray-700 hover:text-gray-900"><IconBrandYoutube size={18} /></Link>
        </div>
      </div>

      {/* Pagamento e segurança */}
      <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 py-4 px-4 md:px-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 mr-2">Formas de pagamento</span>
          {['Visa', 'Mastercard', 'Pix', 'Boleto', 'Amex'].map((p, i) => (
            <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded border text-gray-700">
              {p}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap md:justify-end">
          <span className="text-sm text-gray-600 mr-2">Total segurança</span>
          {['SSL', 'Secure Checkout', 'Encrypted'].map((p, i) => (
            <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded border text-gray-700">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-[1400px] w-full mx-auto text-[12px] text-gray-500 py-4 border-t px-4 md:px-6">
        © Zavy — Conteúdo mockado para demonstração.
      </div>
    </footer>
  );
}

export default Footer;