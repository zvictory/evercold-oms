import BranchesList from "@/components/BranchesList";

export const metadata = {
  title: "Управление филиалами",
  description: "Просмотр и управление филиалами клиентов",
};

export default function BranchesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление филиалами</h1>
          <p className="text-gray-600 mt-2">
            Просматривайте и управляйте филиалами клиентов, назначайте техников
          </p>
        </div>

        <BranchesList />
      </div>
    </div>
  );
}
