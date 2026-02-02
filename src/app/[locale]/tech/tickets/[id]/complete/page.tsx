import CompleteServiceForm from "@/components/CompleteServiceForm";

export default function CompleteTicketPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto py-8">
      <CompleteServiceForm ticketId={params.id} />
    </div>
  );
}
