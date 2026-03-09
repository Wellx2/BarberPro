-- AlterTable
ALTER TABLE "barbers" ADD COLUMN     "bio" TEXT;

-- AlterTable
ALTER TABLE "barbershops" ADD COLUMN     "vipBannerText" TEXT NOT NULL DEFAULT 'Assine qualquer plano e ganhe até 40% de desconto em todos os produtos',
ADD COLUMN     "vipBannerTitle" TEXT NOT NULL DEFAULT 'Benefício de Assinante';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "formulation" TEXT,
ADD COLUMN     "howToUse" TEXT,
ADD COLUMN     "recommendedFor" TEXT;

-- CreateTable
CREATE TABLE "barbershop_hero_settings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Estilo & Tradição',
    "subtitle" TEXT NOT NULL DEFAULT 'Excelência no atendimento',
    "backgroundImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbershop_hero_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barbershop_plans_content" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL DEFAULT 'Assinaturas',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Faça parte do clube e tenha benefícios exclusivos',
    "benefit1Title" TEXT NOT NULL DEFAULT 'Economia Real',
    "benefit1Text" TEXT,
    "benefit2Title" TEXT NOT NULL DEFAULT 'Sempre Alinhado',
    "benefit2Text" TEXT,
    "benefit3Title" TEXT NOT NULL DEFAULT 'Sem Fidelidade',
    "benefit3Text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbershop_plans_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barbershop_faq" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbershop_faq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "barbershop_hero_settings_shopId_key" ON "barbershop_hero_settings"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "barbershop_plans_content_shopId_key" ON "barbershop_plans_content"("shopId");

-- CreateIndex
CREATE INDEX "barbershop_faq_shopId_idx" ON "barbershop_faq"("shopId");

-- AddForeignKey
ALTER TABLE "barbershop_hero_settings" ADD CONSTRAINT "barbershop_hero_settings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barbershop_plans_content" ADD CONSTRAINT "barbershop_plans_content_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barbershop_faq" ADD CONSTRAINT "barbershop_faq_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
