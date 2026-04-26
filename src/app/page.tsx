import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg">
        🎯
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Loyalty SaaS</h1>
      <p className="text-slate-600 mb-8 max-w-sm text-base">
        Stamp loyalty cards for your customers. Works with Apple &amp; Google Wallet.
      </p>
      <Link
        href="/login"
        className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
      >
        Merchant login
      </Link>
    </div>
  );
}
