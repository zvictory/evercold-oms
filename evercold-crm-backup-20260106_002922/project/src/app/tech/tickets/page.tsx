import TicketsTable from "@/components/TicketsTable";

export const metadata = {
  title: "Мои билеты",
  description: "Просмотр назначенных сервисных билетов",
};

export default function TechnicianTicketsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Мои билеты</h1>
          <p className="text-gray-600 mt-2">Сервисные билеты, назначенные вам</p>
        </div>

        <TicketsTable />
      </div>
    </div>
  );
}
