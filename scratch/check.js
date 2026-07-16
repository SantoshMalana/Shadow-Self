const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.hxwtncympvofombrajht:Demonop24x011@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres'
    }
  }
});
async function check() {
  try {
    const events = await prisma.$queryRawUnsafe('SELECT * FROM safety_events');
    console.log(JSON.stringify(events, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
check();
