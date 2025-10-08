import { useMantineColorScheme } from '@mantine/core';
import ControlBar from './ControlBar';
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
    <div
      className={`fixed top-0 left-0 right-0 z-[200] ${
        dark ? 'bg-black/80' : 'bg-white/90'
      } backdrop-blur border-b`}
    >
      <ControlBar />
      <NavBar />
    </div>
  );
}

export default Header;
