import { Suspense } from "react";
import BranchTechnicianAssignment from "@/components/BranchTechnicianAssignment";
import Link from "next/link";

async function getBranchName(branchId: string) {
  try {
    const branches = [
      { id: "1", branchName: "Кузельный рынок" },
      { id: "2", branchName: "Чиланзар" },
      { id: "3", branchName: "Олмазар" },
    ];
    const branch = branches.find((b) => b.id === branchId);
    return branch?.branchName || "Филиал";
  } catch (err) {
    console.error("Failed to fetch branch name:", err);
  }
  return "Филиал";
}

export const metadata = {
  title: "Назначение техников филиалу",
  description: "Управление техниками, работающими на филиале",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BranchTechniciansPage({ params }: PageProps) {
  const { id } = await params;
  const branchName = await getBranchName(id);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link
            href="/admin/branches"
            className="text-blue-600 hover:text-blue-800 font-medium mb-4 block"
          >
            ← Вернуться к филиалам
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Управление техниками филиала
          </h1>
          <p className="text-gray-600 mt-2">
            Назначьте техников, которые будут работать в этом филиале
          </p>
        </div>

        <Suspense
          fallback={
            <div className="text-center py-12">
              <p className="text-gray-600">Загрузка данных...</p>
            </div>
          }
        >
          <BranchTechnicianAssignment branchId={id} branchName={branchName} />
        </Suspense>
      </div>
    </div>
  );
}
