import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty SaaS</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Stamp loyalty cards for your customers. No app needed — works with Apple &amp; Google Wallet.
      </p>
      <Link
        href="/login"
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Merchant login
      </Link>
    </div>
  );
}
