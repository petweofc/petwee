import { useMantineColorScheme } from '@mantine/core';
import ControlBar from './ControlBar';
import NavBar from './NavBar';

function Header() {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

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
