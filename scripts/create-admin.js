require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://zafar@localhost:5432/evercold_crm';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createAdminUser() {
  try {
    console.log('Creating admin user...\n');

    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@evercold.uz' },
    });

    if (existingAdmin) {
      console.log('✓ Admin user already exists: admin@evercold.uz');
      console.log('  If you forgot the password, update it manually in the database.\n');
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    const admin = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: 'admin@evercold.uz',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✓ Admin user created successfully!\n');
    console.log('Login credentials:');
    console.log('  Email:    admin@evercold.uz');
    console.log('  Password: Admin123!');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createAdminUser();
