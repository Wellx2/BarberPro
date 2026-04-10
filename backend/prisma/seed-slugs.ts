import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shops = await prisma.barbershop.findMany({
    select: { id: true, name: true, slug: true }
  });
  console.log('\n🏪 Lojas atuais no banco de dados:');
  console.log(JSON.stringify(shops, null, 2));

  for (const shop of shops) {
    let slug = shop.slug;
    if (!slug) {
      if (shop.name === 'Barbearia de Oz') {
        slug = 'barbeariadeoz';
      } else if (shop.name === 'StudioJBlack') {
        slug = 'studiojblack';
      } else {
        slug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      }

      await prisma.barbershop.update({
        where: { id: shop.id },
        data: { slug }
      });
      console.log(`✅ Slug definido para "${shop.name}": ${slug}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
