import AccountSidebar from "@/components/AccountSidebar";
import CustomerGuard from "@/components/CustomerGuard";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerGuard>
      <div className="bg-[#F7F8FA] min-h-screen py-8 pb-20">
        <div className="container mx-auto px-4">
          
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="lg:sticky lg:top-24 w-full lg:w-72">
              <AccountSidebar />
            </div>
            <main className="flex-1 w-full">
              <div className="bg-white rounded-2xl border border-[#CCCCCC]/30 p-3 md:p-8 shadow-sm min-h-[600px]">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </CustomerGuard>
  );
}
