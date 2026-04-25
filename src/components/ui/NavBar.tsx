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
    await fetch('/api/sessionLogin', { method: 'DELETE' });
    router.replace('/login');
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active === link.key
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
