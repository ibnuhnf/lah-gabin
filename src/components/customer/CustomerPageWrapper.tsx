import CustomerNavbar from '@/components/customer/CustomerNavbar';

export default function CustomerPageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      <CustomerNavbar />
      <main className="flex-1 pb-16">{children}</main>
      <footer className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border-t border-neutral-200/60 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs text-center py-5">
        <p className="font-medium">© {new Date().getFullYear()} Lah Gabin — Es Gabin Aneka Rasa</p>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Dibuat dengan rasa & biskuit pilihan 🧊</p>
      </footer>
    </div>
  );
}
