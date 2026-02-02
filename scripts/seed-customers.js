require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://zafar@localhost:5432/evercold_crm';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedCustomers() {
  try {
    console.log('Starting customer seeding...\n');

    // Sample customers based on typical Uzbek distribution companies
    const customers = [
      {
        name: 'Korzinka',
        customerCode: 'KZK001',
        contactPerson: 'Фарғона шахри сотувчи',
        phone: '+998781234567',
        email: 'korzinka@example.com',
        hasVat: true,
        notes: 'Крупная сетевая компания',
      },
      {
        name: 'РЦ СУРУМ',
        customerCode: 'RCS001',
        contactPerson: 'Администратор',
        phone: '+998901234567',
        email: 'surym@example.com',
        hasVat: true,
        notes: 'Региональный центр',
      },
      {
        name: 'Ever Cold Ice Distribution',
        customerCode: 'ECI001',
        contactPerson: 'Менеджер продаж',
        phone: '+998901111111',
        email: 'sales@evercold.uz',
        hasVat: true,
        notes: 'Сеть магазинов льда',
      },
      {
        name: 'Uzbek Retail Network',
        customerCode: 'URN001',
        contactPerson: 'Закупщик',
        phone: '+998902222222',
        email: 'purchasing@retail.uz',
        hasVat: false,
        notes: 'Розничная сеть',
      },
    ];

    let created = 0;
    for (const customer of customers) {
      try {
        const existing = await prisma.customer.findFirst({
          where: {
            OR: [
              { name: customer.name },
              { customerCode: customer.customerCode },
            ],
          },
        });

        if (existing) {
          console.log(`✓ Customer already exists: ${customer.name}`);
        } else {
          await prisma.customer.create({
            data: {
              ...customer,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          console.log(`✓ Created customer: ${customer.name}`);
          created++;
        }
      } catch (error) {
        console.error(`✗ Error creating customer ${customer.name}:`, error.message);
      }
    }

    console.log(`\n✓ Seeding completed! ${created} new customers created.`);
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedCustomers();
