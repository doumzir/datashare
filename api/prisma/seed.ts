import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@datashare.com' },
    update: {},
    create: { email: 'demo@datashare.com', password },
  });

  console.log('Seed completed. Demo user:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
