import CustomerNavbar from '@/components/customer/CustomerNavbar';

export default function CustomerPageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <CustomerNavbar />
      <main className="flex-1">{children}</main>
      <footer className="bg-brand-900 text-blue-200 text-xs text-center py-4">
        © {new Date().getFullYear()} Lah Gabin — Es Gabin Aneka Rasa
      </footer>
    </div>
  );
}
