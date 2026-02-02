import { NextRequest, NextResponse } from "next/server";

// Demo technicians for now (replace with DB later)
const demoTechnicians = [
  { id: "tech1", name: "Иван Смирнов", email: "ivan@example.com", phone: "+998 (99) 123-45-67", specialization: "compressor" },
  { id: "tech2", name: "Петр Волков", email: "petr@example.com", phone: "+998 (99) 234-56-78", specialization: "electrical" },
  { id: "tech3", name: "Сергей Иванов", email: "sergey@example.com", phone: "+998 (99) 345-67-89", specialization: "hydraulic" },
  { id: "tech4", name: "Андрей Петров", email: "andrey@example.com", phone: "+998 (99) 456-78-90", specialization: "diagnostics" },
];

export async function GET() {
  try {
    return NextResponse.json(demoTechnicians);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const newTechnician = {
      id: `tech_${Date.now()}`,
      name: body.name,
      email: body.email || "",
      phone: body.phone || "",
      specialization: body.specialization || "universal",
    };

    // In a real app, save to database
    // For now, just return the created technician
    return NextResponse.json(newTechnician, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
