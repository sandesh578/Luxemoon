import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const APPLY_CHANGES = process.env.APPLY_HERO_FIX === 'true';

async function main() {
  const content = await prisma.homepageContent.findUnique({where: {id: 1}});
  if (!content) return;
  const slides = content.heroSlides as any[];
  const newSlides = slides.map(slide => {
    if (slide.image && slide.image.includes('psbwnmfub1egs1lfcdrg')) {
      return { ...slide, image: '/products/combo.png' };
    }
    return slide;
  });
  if (!APPLY_CHANGES) {
    console.log('Dry run complete. Set APPLY_HERO_FIX=true to persist changes.');
    return;
  }

  await prisma.homepageContent.update({
    where: { id: 1 },
    data: { heroSlides: newSlides }
  });
  console.log('Fixed broken hero image URL');
}
main().catch(console.error).finally(()=>prisma.$disconnect());
