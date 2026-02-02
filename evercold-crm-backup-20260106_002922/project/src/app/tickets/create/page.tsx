import TicketCreateForm from "@/components/TicketCreateForm";

export const metadata = {
  title: "Создать билет",
  description: "Создать новый сервисный билет",
};

export default function CreateTicketPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <TicketCreateForm />
      </div>
    </div>
  );
}
