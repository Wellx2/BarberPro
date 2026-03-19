const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'src/pages/admin/AdminDashboard.tsx');

let content = fs.readFileSync(dashboardPath, 'utf-8');

// Adicionar importações se não estiverem presentes
if (!content.includes('import { ServicesTab }')) {
  content = content.replace(
    /import \{ TeamTab \} from '\.\/TeamTab';/,
    `import { TeamTab } from './TeamTab';\nimport { ServicesTab } from './ServicesTab';\nimport { ProductsTab } from './ProductsTab';\nimport { StockTab } from './StockTab';\nimport { PlansTab } from './PlansTab';`
  );
}

// Para o Services
const servicesStart = content.indexOf("{/* Services Tab */}");
const servicesEndIndicator = "{/* Products Tab */}";
const servicesEnd = content.indexOf(servicesEndIndicator);

if (servicesStart !== -1 && servicesEnd !== -1) {
    const replacement = `{/* Services Tab */}
        {activeTab === 'SERVICES' && (
          <ServicesTab
            unitServices={unitServices}
            loadingServices={loadingServices}
            handleOpenServiceModal={handleOpenServiceModal}
            toggleActive={toggleActive}
            deleteItem={deleteItem}
            fallbackImage={fallbackImage}
          />
        )}

        `;
    content = content.substring(0, servicesStart) + replacement + content.substring(servicesEnd);
}

// Para Products
const productsStart = content.indexOf("{/* Products Tab */}");
const productsEndIndicator = "{/* Estoque Tab - Gestão de Quantidades */}";
const productsEnd = content.indexOf(productsEndIndicator);

if (productsStart !== -1 && productsEnd !== -1) {
    const replacement = `{/* Products Tab */}
        {activeTab === 'PRODUCTS' && (
          <ProductsTab
            products={products}
            loadingProducts={loadingProducts}
            handleOpenProductModal={handleOpenProductModal}
            toggleActive={toggleActive}
            fallbackImage={fallbackImage}
          />
        )}

        `;
    content = content.substring(0, productsStart) + replacement + content.substring(productsEnd);
}

// Para Stock
const stockStart = content.indexOf("{/* Estoque Tab - Gestão de Quantidades */}");
const stockEndIndicator = "{/* Plans Tab - Planos de Assinatura */}";
const stockEnd = content.indexOf(stockEndIndicator);

if (stockStart !== -1 && stockEnd !== -1) {
    const replacement = `{/* Estoque Tab - Gestão de Quantidades */}
        {activeTab === 'STOCK' && (
          <StockTab
            products={products}
            setProducts={setProducts}
            loadingProducts={loadingProducts}
            currentShopId={currentShop.id}
            productService={productService}
          />
        )}

        `;
    content = content.substring(0, stockStart) + replacement + content.substring(stockEnd);
}

// Para Plans
const plansStart = content.indexOf("{/* Plans Tab - Planos de Assinatura */}");
const plansEndIndicator = "{/* Settings Tab - Configurações de Módulos */}";
const plansEnd = content.indexOf(plansEndIndicator);

if (plansStart !== -1 && plansEnd !== -1) {
    const replacement = `{/* Plans Tab - Planos de Assinatura */}
        {activeTab === 'PLANS' && (
          <PlansTab
            plans={plans}
            loadingPlans={loadingPlans}
            handleOpenPlanModal={handleOpenPlanModal}
            handleTogglePlanActive={handleTogglePlanActive}
            handleDeletePlan={handleDeletePlan}
          />
        )}

        `;
    content = content.substring(0, plansStart) + replacement + content.substring(plansEnd);
}

fs.writeFileSync(dashboardPath, content);
console.log('Feito!');
