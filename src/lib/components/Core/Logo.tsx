import Link from 'next/link';
import Image from 'next/image';

function Logo({ className, name = 'ZAVY' }: { name?: string; className?: string }) {
  return (
    <Link href="/">
      <div className="flex w-full pt-8 pb-16 h-full lg:pb-4 justify-center items-start">
        <Image src="/logo.jpeg" alt={name} width={160} height={48} />
      </div>
    </Link>
  );
}

export default Logo;
