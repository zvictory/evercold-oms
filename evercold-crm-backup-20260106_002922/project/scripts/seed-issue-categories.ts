import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create main category
  const category = await prisma.issueCategory.upsert({
    where: { name: "Cooling Equipment Problems" },
    update: {},
    create: {
      name: "Cooling Equipment Problems",
      description: "Issues related to cooling equipment and refrigeration systems",
    },
  });

  // Create subcategories
  const subcategories = [
    {
      name: "Cold Chambers",
      description: "Problems with cold storage chambers",
    },
    {
      name: "Glass Repair",
      description: "Glass door or window damage/replacement",
    },
    {
      name: "Temperature Control",
      description: "Temperature regulation and thermostat issues",
    },
    {
      name: "Leaking Water",
      description: "Water leaks from cooling equipment",
    },
    {
      name: "Equipment Not Working",
      description: "Equipment failure or not powering on",
    },
    {
      name: "Noise/Vibration",
      description: "Abnormal noise or vibration from equipment",
    },
  ];

  for (const sub of subcategories) {
    await prisma.issueSubcategory.upsert({
      where: { categoryId_name: { categoryId: category.id, name: sub.name } },
      update: { description: sub.description },
      create: {
        categoryId: category.id,
        name: sub.name,
        description: sub.description,
        slaResponseCritical: 60,
        slaResponseHigh: 240,
        slaResponseNormal: 1440,
        slaResponseLow: 2880,
        slaResolutionCritical: 240,
        slaResolutionHigh: 1440,
        slaResolutionNormal: 2880,
        slaResolutionLow: 4320,
      },
    });
  }

  console.log("✓ Issue categories seeded successfully");
  console.log(`- Created category: ${category.name}`);
  console.log(`- Created ${subcategories.length} subcategories`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("Error seeding database:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
