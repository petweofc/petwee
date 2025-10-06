import { useMantineColorScheme } from '@mantine/core';
import Logo from './Logo';
import NavBar from './NavBar';
import { useState } from 'react';
import { useRouter } from 'next/router';

function Header() {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className={`w-full ${dark ? 'bg-black' : 'bg-white'}`}>
      {/* Barra superior com informações de entrega */}
      <div className="bg-gray-100 text-gray-600 text-sm py-1 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Seu pedido entregue em até 1 hora*</span>
          <a href="#" className="ml-2 text-teal-500 hover:underline">Saiba mais</a>
        </div>
        <div>
          <button className="text-gray-600 hover:text-teal-500">Atendimento</button>
        </div>
      </div>

      {/* Barra principal com logo, busca e ícones */}
      <div className="bg-teal-500 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Barra de pesquisa */}
          <form onSubmit={handleSearch} className="flex-grow mx-4 max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="O que seu pet precisa?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 text-sm border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
              <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </form>

          {/* Ícones de usuário, favoritos e carrinho */}
          <div className="flex items-center space-x-4 text-white">
            <a href="/login" className="flex items-center hover:text-teal-200">
              <span className="mr-1">Entrar ou cadastrar-se</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </a>
            <a href="#" className="hover:text-teal-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </a>
            <a href="/cart" className="hover:text-teal-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Barra de navegação com categorias */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-8 text-sm font-medium">
            <button className="flex items-center px-3 py-4 text-gray-700 hover:text-teal-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Todos
            </button>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Cachorros</a>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Gatos</a>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Pássaros</a>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Peixes</a>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Outros Pets</a>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Casa e Jardim</a>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Promoções</a>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Serviços</a>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Clubz</a>
            <a href="#" className="px-3 py-4 text-gray-700 hover:text-teal-500 border-b-2 border-transparent hover:border-teal-500">Recompra</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
