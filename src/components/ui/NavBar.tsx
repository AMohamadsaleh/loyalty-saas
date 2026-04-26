'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';

interface Props {
  active: 'scan' | 'activity' | 'settings';
}

const links = [
  { href: '/scan', label: 'Scan', key: 'scan' as const },
  { href: '/activity', label: 'Activity', key: 'activity' as const },
  { href: '/settings', label: 'Settings', key: 'settings' as const },
];

export function NavBar({ active }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut(getClientAuth());
    // Clear both cookie types
    document.cookie = 'session=; path=/; max-age=0';
    document.cookie = 'auth=; path=/; max-age=0';
    router.replace('/login');
  }

  return (
    <nav className="bg-white border-b-2 border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                active === link.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
