import Link from 'next/link';
import { pages } from './SideNavBar';

function NavBar({ className }: { className?: string }) {
  return (
    <nav className="hidden w-full h-16 items-center font-light text-black text-lg xl:text-xl lg:flex border-t border-gray-200">
      <div className="w-[max(92%,1400px)] mx-auto flex justify-start gap-6">
        {pages.map((page, i) => (
          <Link
            href={page.link}
            className={'px-3 py-2 cursor-pointer hover:underline hover:decoration-green-600'}
            key={i}
          >
            {page.label.toUpperCase()}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default NavBar;
