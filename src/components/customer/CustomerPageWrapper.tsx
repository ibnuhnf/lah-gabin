import CustomerNavbar from '@/components/customer/CustomerNavbar';
import FloatingCartBar from '@/components/customer/FloatingCartBar';

export default function CustomerPageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors relative">
      <CustomerNavbar />
      <main className="flex-1 pb-24">{children}</main>
      <FloatingCartBar />
      <footer className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs text-center py-4">
        <p className="font-medium">© {new Date().getFullYear()} Lah Gabin. All rights reserved.</p>
      </footer>
    </div>
  );
}
