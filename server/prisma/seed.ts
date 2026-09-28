import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Jay Mataji Rajwadi Chai Shop Management System...');

  // 1. Business Settings
  await prisma.businessSettings.upsert({
    where: { id: 'default_settings' },
    update: {},
    create: {
      id: 'default_settings',
      shopName: 'Jay Mataji Rajwadi Chai',
      tagline: 'Taste of Royal Heritage - Authentic Rajwadi Tea & Snacks',
      address: 'Shop No. 24, Shiv Shopping Center, Sagvadi  , Virani circale to Water Tank Road, near by Rameshvar Mahadev Temple  bhavnagar.',
      phone: '8401256000',
      email: 'contact@jaymatajichai.com',
      gstNumber: '24AAAAA0000A1Z5',
      invoicePrefix: 'JMRC',
      startInvoiceNumber: 1001,
      defaultTaxRate: 5.0,
      defaultReceiptWidth: '80mm',
      allowNegativeStock: false,
      lowStockThreshold: 10,
      minAgeForRestricted: 18,
      enableAgeVerification: true,
      currencySymbol: '₹',
    },
  });

  // 2. Users (Roles: ADMIN, CASHIER, INVENTORY_MANAGER)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const cashierPassword = await bcrypt.hash('cashier123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'PRINCE DUMARALIYA (Owner)',
      email: 'owner@jaymatajichai.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      name: 'Vikram Sinh (Cashier)',
      email: 'cashier@jaymatajichai.com',
      password: cashierPassword,
      role: 'CASHIER',
      isActive: true,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      name: 'Pradeep Bhai (Inventory Manager)',
      email: 'inventory@jaymatajichai.com',
      password: managerPassword,
      role: 'INVENTORY_MANAGER',
      isActive: true,
    },
  });

  // 3. Categories
  const categoriesData = [
    { name: 'Tea & Chai', description: 'Royal brewed hot teas and traditional Gujarati chais', color: '#b45309' },
    { name: 'Coffee', description: 'Hot and cold royal coffees', color: '#78350f' },
    { name: 'Cold Drinks', description: 'Chilled soft drinks and coolers', color: '#0284c7' },
    { name: 'Snacks & Farsan', description: 'Fresh samosas, maskabun, and hot farsan', color: '#ea580c' },
    { name: 'Biscuits & Bakery', description: 'Crisp rusks, cookies and bakery items', color: '#d97706' },
    { name: 'Packaged Foods & Namkeen', description: 'Wafers, sev, and packaged namkeen', color: '#ca8a04' },
    { name: 'Water', description: 'Chilled and normal packaged mineral water', color: '#06b6d4' },
    { name: 'Tobacco & Cigarettes', description: 'Legally permitted age-restricted products (18+ only)', color: '#dc2626' },
    { name: 'Other', description: 'General merchandise and sundries', color: '#4b5563' },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryMap[cat.name] = created.id;
  }

  // 4. Expense Categories
  const expenseCats = [
    { name: 'Tea Ingredients & Milk', description: 'Tea leaves, cow/buffalo milk, saffron, cardamom, ginger' },
    { name: 'Rent', description: 'Shop premises monthly rent' },
    { name: 'Electricity & Gas', description: 'Commercial LPG cylinders and electricity bills' },
    { name: 'Staff Salary', description: 'Monthly wages for counter and kitchen staff' },
    { name: 'Transportation', description: 'Procurement logistics and delivery costs' },
    { name: 'Maintenance & Repairs', description: 'Tea equipment, burner servicing, utensils' },
    { name: 'Packaging & Cups', description: 'Paper cups, plastic glasses, parcel bags' },
    { name: 'Miscellaneous', description: 'Daily minor expenses' },
  ];

  const expenseCategoryMap: Record<string, string> = {};
  for (const expCat of expenseCats) {
    const created = await prisma.expenseCategory.upsert({
      where: { name: expCat.name },
      update: {},
      create: expCat,
    });
    expenseCategoryMap[expCat.name] = created.id;
  }

  // 5. Suppliers
  const suppliersData = [
    {
      name: 'Gujarat Tea Processors & Packers',
      company: 'Wagh Bakri & Gujarat Tea Traders',
      mobile: '9825012345',
      email: 'orders@gujarattea.com',
      address: 'Kalupur Market, Ahmedabad, Gujarat',
      gstNumber: '24AAACG1234F1Z1',
      openingBalance: 0,
      currentBalance: 3500,
    },
    {
      name: 'Amul Dairy Co-op Wholesale',
      company: 'Gujarat Co-operative Milk Marketing Federation',
      mobile: '9825123456',
      email: 'distributor@amul.coop',
      address: 'Anand Milk Center, Ahmedabad Highway',
      gstNumber: '24AAACG5678F1Z2',
      openingBalance: 0,
      currentBalance: 2100,
    },
    {
      name: 'Balaji Wafers & Snacks Ltd',
      company: 'Balaji Snack Distributors',
      mobile: '9825234567',
      email: 'sales@balajisnacks.com',
      address: 'Sanand GIDC, Ahmedabad',
      gstNumber: '24AAACB9012F1Z3',
      openingBalance: 0,
      currentBalance: 0,
    },
    {
      name: 'Bisleri International Gujarat',
      company: 'Bisleri Water Logistics',
      mobile: '9825345678',
      email: 'care@bisleri.in',
      address: 'Naroda Industrial Zone, Ahmedabad',
      gstNumber: '24AAACB3456F1Z4',
      openingBalance: 0,
      currentBalance: 800,
    },
    {
      name: 'Royal General Trading',
      company: 'Royal Fast Moving Consumer Goods Agency',
      mobile: '9825456789',
      email: 'royalgeneral@gmail.com',
      address: 'Relief Road, Ahmedabad',
      gstNumber: '24AAACR7890F1Z5',
      openingBalance: 0,
      currentBalance: 0,
    },
  ];

  const supplierMap: Record<string, string> = {};
  for (const supp of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: supp.name } });
    if (!existing) {
      const created = await prisma.supplier.create({ data: supp });
      supplierMap[supp.name] = created.id;
    } else {
      supplierMap[supp.name] = existing.id;
    }
  }

  // 6. Customers
  const customersData = [
    {
      name: 'Demo Customer',
      mobile: '9898012345',
      email: 'democustomer@gmail.com',
      address: 'Rajwadi Chowk, Ahmedabad',
      openingBalance: 0,
      currentBalance: 0,
      totalPurchases: 110,
    },
    {
      name: 'Rahul Sharma (Regular)',
      mobile: '9898099881',
      email: 'rahul.sharma@gmail.com',
      address: 'B-402, Royal Residency, Ahmedabad',
      openingBalance: 250,
      currentBalance: 250,
      totalPurchases: 450,
    },
    {
      name: 'Amit Patel (Corporate Account)',
      mobile: '9898077665',
      email: 'amit@patelconsultancy.in',
      address: '304, Time Square Arcade, Ahmedabad',
      openingBalance: 1200,
      currentBalance: 1200,
      totalPurchases: 2800,
    },
    {
      name: 'Jignesh Shah (Daily Chai Khata)',
      mobile: '9898055443',
      email: 'jignesh.shah@yahoo.com',
      address: 'Near Old Bus Stand, Ahmedabad',
      openingBalance: 150,
      currentBalance: 150,
      totalPurchases: 620,
    },
  ];

  const customerMap: Record<string, string> = {};
  for (const cust of customersData) {
    const existing = await prisma.customer.findFirst({ where: { mobile: cust.mobile } });
    if (!existing) {
      const created = await prisma.customer.create({ data: cust });
      customerMap[cust.name] = created.id;

      // Opening balance ledger
      if (cust.openingBalance > 0) {
        await prisma.customerLedger.create({
          data: {
            customerId: created.id,
            description: 'Opening Credit Balance (Khata)',
            type: 'DEBIT',
            amount: cust.openingBalance,
            balanceAfter: cust.openingBalance,
            referenceType: 'ADJUSTMENT',
          },
        });
      }
    } else {
      customerMap[cust.name] = existing.id;
    }
  }

  // 7. Products
  const productsData = [
    {
      name: 'Jay Mataji Rajwadi Tea',
      category: 'Tea & Chai',
      brand: 'Jay Mataji Rajwadi',
      sku: 'TEA-RAJ-001',
      barcode: '890100100101',
      unit: 'Cup',
      purchasePrice: 8,
      sellingPrice: 20,
      mrp: 20,
      openingStock: 150,
      currentStock: 148, // 2 sold in demo bill
      minStockLevel: 20,
      maxStockLevel: 500,
      taxRate: 5,
      supplier: 'Gujarat Tea Processors & Packers',
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Cutting Chai',
      category: 'Tea & Chai',
      brand: 'Jay Mataji Rajwadi',
      sku: 'TEA-CUT-002',
      barcode: '890100100102',
      unit: 'Cup',
      purchasePrice: 4,
      sellingPrice: 10,
      mrp: 10,
      openingStock: 200,
      currentStock: 200,
      minStockLevel: 25,
      maxStockLevel: 600,
      taxRate: 5,
      supplier: 'Gujarat Tea Processors & Packers',
      imageUrl: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Masala Chai',
      category: 'Tea & Chai',
      brand: 'Jay Mataji Rajwadi',
      sku: 'TEA-MAS-003',
      barcode: '890100100103',
      unit: 'Cup',
      purchasePrice: 6,
      sellingPrice: 15,
      mrp: 15,
      openingStock: 120,
      currentStock: 120,
      minStockLevel: 20,
      maxStockLevel: 400,
      taxRate: 5,
      supplier: 'Gujarat Tea Processors & Packers',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Ginger (Adrak) Tea',
      category: 'Tea & Chai',
      brand: 'Jay Mataji Rajwadi',
      sku: 'TEA-GIN-004',
      barcode: '890100100104',
      unit: 'Cup',
      purchasePrice: 6,
      sellingPrice: 15,
      mrp: 15,
      openingStock: 100,
      currentStock: 100,
      minStockLevel: 15,
      maxStockLevel: 350,
      taxRate: 5,
      supplier: 'Gujarat Tea Processors & Packers',
      imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Elaichi (Cardamom) Tea',
      category: 'Tea & Chai',
      brand: 'Jay Mataji Rajwadi',
      sku: 'TEA-ELA-005',
      barcode: '890100100105',
      unit: 'Cup',
      purchasePrice: 6,
      sellingPrice: 15,
      mrp: 15,
      openingStock: 110,
      currentStock: 110,
      minStockLevel: 15,
      maxStockLevel: 350,
      taxRate: 5,
      supplier: 'Gujarat Tea Processors & Packers',
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Special Royal Kesar Chai',
      category: 'Tea & Chai',
      brand: 'Jay Mataji Rajwadi',
      sku: 'TEA-KES-006',
      barcode: '890100100106',
      unit: 'Cup',
      purchasePrice: 12,
      sellingPrice: 30,
      mrp: 30,
      openingStock: 80,
      currentStock: 80,
      minStockLevel: 10,
      maxStockLevel: 250,
      taxRate: 5,
      supplier: 'Gujarat Tea Processors & Packers',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Royal Cold Coffee with Ice Cream',
      category: 'Coffee',
      brand: 'Jay Mataji Rajwadi',
      sku: 'COF-CLD-007',
      barcode: '890100100107',
      unit: 'Glass',
      purchasePrice: 22,
      sellingPrice: 50,
      mrp: 50,
      openingStock: 40,
      currentStock: 40,
      minStockLevel: 10,
      maxStockLevel: 150,
      taxRate: 5,
      supplier: 'Amul Dairy Co-op Wholesale',
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Hot Filter Coffee',
      category: 'Coffee',
      brand: 'Jay Mataji Rajwadi',
      sku: 'COF-HOT-008',
      barcode: '890100100108',
      unit: 'Cup',
      purchasePrice: 10,
      sellingPrice: 25,
      mrp: 25,
      openingStock: 75,
      currentStock: 75,
      minStockLevel: 15,
      maxStockLevel: 200,
      taxRate: 5,
      supplier: 'Amul Dairy Co-op Wholesale',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Water Bottle 500ml',
      category: 'Water',
      brand: 'Bisleri',
      sku: 'WAT-500-009',
      barcode: '890100100109',
      unit: 'Bottle',
      purchasePrice: 6,
      sellingPrice: 10,
      mrp: 10,
      openingStock: 100,
      currentStock: 99, // 1 sold in demo bill
      minStockLevel: 25,
      maxStockLevel: 300,
      taxRate: 0,
      supplier: 'Bisleri International Gujarat',
      imageUrl: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Water Bottle 1 Litre',
      category: 'Water',
      brand: 'Bisleri',
      sku: 'WAT-100-010',
      barcode: '890100100110',
      unit: 'Bottle',
      purchasePrice: 12,
      sellingPrice: 20,
      mrp: 20,
      openingStock: 80,
      currentStock: 80,
      minStockLevel: 20,
      maxStockLevel: 250,
      taxRate: 0,
      supplier: 'Bisleri International Gujarat',
      imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Thums Up 250ml Can',
      category: 'Cold Drinks',
      brand: 'Coca Cola / Thums Up',
      sku: 'DRK-THU-011',
      barcode: '890100100111',
      unit: 'Can',
      purchasePrice: 24,
      sellingPrice: 35,
      mrp: 35,
      openingStock: 60,
      currentStock: 60,
      minStockLevel: 15,
      maxStockLevel: 200,
      taxRate: 18,
      supplier: 'Royal General Trading',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Sprite 250ml Bottle',
      category: 'Cold Drinks',
      brand: 'Sprite',
      sku: 'DRK-SPR-012',
      barcode: '890100100112',
      unit: 'Bottle',
      purchasePrice: 14,
      sellingPrice: 20,
      mrp: 20,
      openingStock: 50,
      currentStock: 50,
      minStockLevel: 15,
      maxStockLevel: 150,
      taxRate: 18,
      supplier: 'Royal General Trading',
      imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Parle-G Biscuit Packet',
      category: 'Biscuits & Bakery',
      brand: 'Parle',
      sku: 'BIS-PAR-013',
      barcode: '890100100113',
      unit: 'Pkt',
      purchasePrice: 7.5,
      sellingPrice: 10,
      mrp: 10,
      openingStock: 90,
      currentStock: 90,
      minStockLevel: 20,
      maxStockLevel: 250,
      taxRate: 5,
      supplier: 'Royal General Trading',
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Britannia Good Day Butter',
      category: 'Biscuits & Bakery',
      brand: 'Britannia',
      sku: 'BIS-BRI-014',
      barcode: '890100100114',
      unit: 'Pkt',
      purchasePrice: 15,
      sellingPrice: 20,
      mrp: 20,
      openingStock: 50,
      currentStock: 50,
      minStockLevel: 15,
      maxStockLevel: 180,
      taxRate: 5,
      supplier: 'Royal General Trading',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Fresh Amul Maskabun',
      category: 'Snacks & Farsan',
      brand: 'Jay Mataji Rajwadi',
      sku: 'SNK-MSK-015',
      barcode: '890100100115',
      unit: 'Pcs',
      purchasePrice: 14,
      sellingPrice: 30,
      mrp: 30,
      openingStock: 45,
      currentStock: 45,
      minStockLevel: 10,
      maxStockLevel: 100,
      taxRate: 5,
      supplier: 'Amul Dairy Co-op Wholesale',
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Hot Bun Samosa',
      category: 'Snacks & Farsan',
      brand: 'Jay Mataji Rajwadi',
      sku: 'SNK-BUN-016',
      barcode: '890100100116',
      unit: 'Pcs',
      purchasePrice: 20,
      sellingPrice: 40,
      mrp: 40,
      openingStock: 30,
      currentStock: 29, // 1 sold in demo bill
      minStockLevel: 10,
      maxStockLevel: 80,
      taxRate: 5,
      supplier: 'Amul Dairy Co-op Wholesale',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Gujarati Methi Gota Plate',
      category: 'Snacks & Farsan',
      brand: 'Jay Mataji Rajwadi',
      sku: 'SNK-MET-017',
      barcode: '890100100117',
      unit: 'Plate',
      purchasePrice: 25,
      sellingPrice: 50,
      mrp: 50,
      openingStock: 25,
      currentStock: 25,
      minStockLevel: 8,
      maxStockLevel: 60,
      taxRate: 5,
      supplier: 'Amul Dairy Co-op Wholesale',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Balaji Masala Wafers 45g',
      category: 'Packaged Foods & Namkeen',
      brand: 'Balaji',
      sku: 'BAL-WAF-018',
      barcode: '890100100118',
      unit: 'Pkt',
      purchasePrice: 7,
      sellingPrice: 10,
      mrp: 10,
      openingStock: 70,
      currentStock: 70,
      minStockLevel: 20,
      maxStockLevel: 200,
      taxRate: 12,
      supplier: 'Balaji Wafers & Snacks Ltd',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Balaji Sev Murmura 50g',
      category: 'Packaged Foods & Namkeen',
      brand: 'Balaji',
      sku: 'BAL-SEV-019',
      barcode: '890100100119',
      unit: 'Pkt',
      purchasePrice: 7,
      sellingPrice: 10,
      mrp: 10,
      openingStock: 60,
      currentStock: 60,
      minStockLevel: 15,
      maxStockLevel: 200,
      taxRate: 12,
      supplier: 'Balaji Wafers & Snacks Ltd',
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: false,
    },
    {
      name: 'Classic Cigarette Stick (Age 18+)',
      category: 'Tobacco & Cigarettes',
      brand: 'Classic',
      sku: 'TOB-CLA-020',
      barcode: '890100100120',
      unit: 'Stick',
      purchasePrice: 14,
      sellingPrice: 18,
      mrp: 18,
      openingStock: 60,
      currentStock: 60,
      minStockLevel: 15,
      maxStockLevel: 150,
      taxRate: 28,
      supplier: 'Royal General Trading',
      imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: true,
      complianceNotes: 'Statutory Warning: Smoking causes throat cancer. Strictly sold only to individuals aged 18 and older.',
    },
    {
      name: 'Gold Flake Cigarette Stick (Age 18+)',
      category: 'Tobacco & Cigarettes',
      brand: 'Gold Flake',
      sku: 'TOB-GLD-021',
      barcode: '890100100121',
      unit: 'Stick',
      purchasePrice: 11,
      sellingPrice: 15,
      mrp: 15,
      openingStock: 50,
      currentStock: 50,
      minStockLevel: 15,
      maxStockLevel: 150,
      taxRate: 28,
      supplier: 'Royal General Trading',
      imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
      isAgeRestricted: true,
      complianceNotes: 'Statutory Warning: Tobacco kills. Government compliance mandatory. Verify buyer age before checkout.',
    },
  ];

  const productMap: Record<string, any> = {};

  for (const prod of productsData) {
    const categoryId = categoryMap[prod.category] || categoryMap['Other'];
    const supplierId = supplierMap[prod.supplier] || null;

    const existing = await prisma.product.findUnique({ where: { sku: prod.sku } });
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          name: prod.name,
          categoryId,
          supplierId,
          brand: prod.brand,
          sku: prod.sku,
          barcode: prod.barcode,
          unit: prod.unit,
          purchasePrice: prod.purchasePrice,
          sellingPrice: prod.sellingPrice,
          mrp: prod.mrp,
          openingStock: prod.openingStock,
          currentStock: prod.currentStock,
          minStockLevel: prod.minStockLevel,
          maxStockLevel: prod.maxStockLevel,
          taxRate: prod.taxRate,
          imageUrl: prod.imageUrl,
          isAgeRestricted: prod.isAgeRestricted,
          complianceNotes: prod.complianceNotes,
          status: 'ACTIVE',
        },
      });

      productMap[prod.name] = created;

      // Create Opening Stock Transaction record
      await prisma.stockTransaction.create({
        data: {
          productId: created.id,
          type: 'OPENING_STOCK',
          quantity: prod.openingStock,
          rate: prod.purchasePrice,
          reference: 'INITIAL_SETUP',
          balanceAfter: prod.openingStock,
          notes: 'Shop initial inventory setup',
          createdById: adminUser.id,
        },
      });
    } else {
      productMap[prod.name] = existing;
    }
  }

  // 8. Sample Expenses
  const sampleExpenses = [
    {
      title: 'Commercial LPG Cylinder (19kg)',
      category: 'Electricity & Gas',
      amount: 1850,
      paymentMethod: 'UPI',
      notes: 'Bharat Gas commercial cylinder refill',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Daily Fresh Buffalo Milk (30 Litres)',
      category: 'Tea Ingredients & Milk',
      amount: 1950,
      paymentMethod: 'CASH',
      notes: 'Morning fresh milk supply @ ₹65/L',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Biodegradable Paper Tea Cups (1000 Pcs)',
      category: 'Packaging & Cups',
      amount: 600,
      paymentMethod: 'CASH',
      notes: 'Printed Jay Mataji Rajwadi cups',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const exp of sampleExpenses) {
    const catId = expenseCategoryMap[exp.category] || Object.values(expenseCategoryMap)[0];
    await prisma.expense.create({
      data: {
        title: exp.title,
        categoryId: catId,
        amount: exp.amount,
        paymentMethod: exp.paymentMethod,
        notes: exp.notes,
        date: exp.date,
        createdById: adminUser.id,
      },
    });
  }

  // 9. Requirement 43: DEMO BILL
  // Create sample bill:
  // Customer: Demo Customer
  // Rajwadi Tea × 2 (₹20 x 2 = ₹40)
  // Water Bottle × 1 (₹10 x 1 = ₹10)
  // Bun Samosa × 1 (₹40 x 1 = ₹40)
  // Subtotal: ₹90, Tax (5% on ₹80 = ₹4, 0% on water = ₹0) = ₹4, Discount: ₹0, Total: ₹94
  // Let's create this sample bill with complete relational data!

  const demoCust = await prisma.customer.findFirst({ where: { name: 'Demo Customer' } });
  const rajwadiTea = productMap['Jay Mataji Rajwadi Tea'];
  const waterBottle = productMap['Water Bottle 500ml'];
  const bunSamosa = productMap['Hot Bun Samosa'];

  if (demoCust && rajwadiTea && waterBottle && bunSamosa) {
    const existingDemoSale = await prisma.sale.findUnique({ where: { invoiceNumber: 'JMRC-1001' } });
    if (!existingDemoSale) {
      const sale = await prisma.sale.create({
        data: {
          invoiceNumber: 'JMRC-1001',
          customerId: demoCust.id,
          cashierId: cashierUser.id,
          subtotal: 90,
          discount: 0,
          tax: 4,
          total: 94,
          paidAmount: 100,
          changeAmount: 6,
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          ageVerified: false,
          status: 'COMPLETED',
          notes: 'Official Inaugural Demo Bill - Welcome to Jay Mataji Rajwadi Chai!',
          items: {
            create: [
              {
                productId: rajwadiTea.id,
                productName: rajwadiTea.name,
                quantity: 2,
                unitPrice: 20,
                purchasePrice: 8,
                discount: 0,
                tax: 2, // ₹1/cup
                totalPrice: 42,
              },
              {
                productId: waterBottle.id,
                productName: waterBottle.name,
                quantity: 1,
                unitPrice: 10,
                purchasePrice: 6,
                discount: 0,
                tax: 0,
                totalPrice: 10,
              },
              {
                productId: bunSamosa.id,
                productName: bunSamosa.name,
                quantity: 1,
                unitPrice: 40,
                purchasePrice: 20,
                discount: 0,
                tax: 2,
                totalPrice: 42,
              },
            ],
          },
        },
      });

      // Stock transactions for the demo bill items
      await prisma.stockTransaction.create({
        data: {
          productId: rajwadiTea.id,
          type: 'SALE',
          quantity: -2,
          rate: 20,
          reference: 'INVOICE: JMRC-1001',
          balanceAfter: 148,
          notes: 'Sale to Demo Customer',
          createdById: cashierUser.id,
        },
      });

      await prisma.stockTransaction.create({
        data: {
          productId: waterBottle.id,
          type: 'SALE',
          quantity: -1,
          rate: 10,
          reference: 'INVOICE: JMRC-1001',
          balanceAfter: 99,
          notes: 'Sale to Demo Customer',
          createdById: cashierUser.id,
        },
      });

      await prisma.stockTransaction.create({
        data: {
          productId: bunSamosa.id,
          type: 'SALE',
          quantity: -1,
          rate: 40,
          reference: 'INVOICE: JMRC-1001',
          balanceAfter: 29,
          notes: 'Sale to Demo Customer',
          createdById: cashierUser.id,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: cashierUser.id,
          userName: cashierUser.name,
          action: 'SALE_CREATE',
          entity: 'SALE',
          entityId: sale.id,
          details: JSON.stringify({
            invoiceNumber: 'JMRC-1001',
            total: 94,
            customer: 'Demo Customer',
            itemsCount: 3,
          }),
        },
      });
    }
  }

  console.log('Seeding completed successfully with DEMO DATA and DEMO BILL JMRC-1001!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
