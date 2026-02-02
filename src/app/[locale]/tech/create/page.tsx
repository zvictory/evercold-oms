import TechnicianCreateForm from "@/components/TechnicianCreateForm";

export const metadata = {
  title: "Добавить техника",
  description: "Создать новый профиль техника",
};

export default function CreateTechnicianPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <TechnicianCreateForm />
      </div>
    </div>
  );
}
