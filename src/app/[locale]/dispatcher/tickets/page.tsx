import TicketsTable from "@/components/TicketsTable";
import Link from "next/link";

export const metadata = {
  title: "Сервисные билеты",
  description: "Просмотр и управление всеми сервисными билетами",
};

export default function DispatcherTicketsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Сервисные билеты</h1>
        <Link
          href="/tickets/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Новый билет
        </Link>
        </div>

        <TicketsTable />
      </div>
    </div>
  );
}
