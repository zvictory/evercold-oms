import TechniciansList from "@/components/TechniciansList";

export const metadata = {
  title: "Управление техниками",
  description: "Просмотр и управление списком техников",
};

export default function TechniciansListPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление техниками</h1>
          <p className="text-gray-600 mt-2">Добавляйте и управляйте техниками для назначения на билеты</p>
        </div>

        <TechniciansList />
      </div>
    </div>
  );
}
