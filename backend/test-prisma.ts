import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const dmmf = (prisma as any)._dmmf;
    const model = dmmf.modelMap.Barbershop;
    console.log('Model Barbershop Fields:');
    model.fields.forEach((f: any) => {
      console.log(`- ${f.name}: ${f.kind} ${f.type} (list: ${f.isList})`);
    });
    
    const shop = await prisma.barbershop.findFirst({
      select: { id: true, name: true, amenities: true }
    });
    console.log('Success fetching shop:', shop);
  } catch (err) {
    console.error('Error fetching shop:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
