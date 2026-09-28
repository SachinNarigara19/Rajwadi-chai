import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding realistic 30-day analytics sales data...');

  const user = await prisma.user.findFirst();
  const customer = await prisma.customer.findFirst();
  const products = await prisma.product.findMany();

  if (!user || products.length === 0) {
    console.log('Missing user or products. Run base seed first.');
    return;
  }

  const rajwadiTea = products.find((p) => p.name.includes('Rajwadi Tea')) || products[0];
  const cuttingChai = products.find((p) => p.name.includes('Cutting Chai')) || products[1];
  const masalaChai = products.find((p) => p.name.includes('Masala Chai')) || products[2];
  const bunSamosa = products.find((p) => p.name.includes('Bun Samosa')) || products[3];
  const maskabun = products.find((p) => p.name.includes('Maskabun')) || products[4];
  const coldCoffee = products.find((p) => p.name.includes('Cold Coffee')) || products[5];
  const wafers = products.find((p) => p.name.includes('Wafers')) || products[6];

  const now = new Date();
  let billCounter = 2000;

  // Clear previous demo analytics sales (keep inaugural JMRC-1001)
  await prisma.saleItem.deleteMany({
    where: {
      sale: {
        invoiceNumber: { startsWith: 'JMRC-ANL-' },
      },
    },
  });
  await prisma.sale.deleteMany({
    where: {
      invoiceNumber: { startsWith: 'JMRC-ANL-' },
    },
  });

  // Loop back 30 days
  for (let i = 29; i >= 0; i--) {
    const saleDate = new Date(now);
    saleDate.setDate(saleDate.getDate() - i);
    const dayOfWeek = saleDate.getDay(); // 0 is Sunday, 6 is Saturday

    // Weekend multiplier: Saturday and Sunday are HIGH SELL days!
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;
    const isMidweekLull = dayOfWeek === 2; // Tuesday is typically lower sell

    // Number of bills for this day
    const billsCount = isWeekend ? 6 : isFriday ? 5 : isMidweekLull ? 2 : 4;

    for (let b = 0; b < billsCount; b++) {
      billCounter++;
      const currentBillTime = new Date(saleDate);

      // Morning rush: 8am - 10am; Evening rush: 5pm - 8pm
      let hour = 8;
      if (b % 3 === 0) hour = 8 + (b % 2); // 8 or 9 AM
      else if (b % 3 === 1) hour = 17 + (b % 3); // 5, 6, 7 PM
      else hour = 14 + (b % 2); // 2 or 3 PM

      currentBillTime.setHours(hour, 10 + b * 7, 0, 0);

      // Item selections for this bill
      // Rajwadi tea is popular every bill; higher quantities on weekends (High sell)
      const teaQty = isWeekend ? (b % 2 === 0 ? 5 : 3) : isMidweekLull ? 1 : 2;
      const snackQty = b % 2 === 0 ? 2 : 1;

      const items = [
        {
          productId: rajwadiTea.id,
          productName: rajwadiTea.name,
          quantity: teaQty,
          unitPrice: rajwadiTea.sellingPrice,
          purchasePrice: rajwadiTea.purchasePrice,
          discount: 0,
          tax: Math.round(teaQty * rajwadiTea.sellingPrice * 0.05 * 100) / 100,
          totalPrice: teaQty * rajwadiTea.sellingPrice,
        },
      ];

      if (b % 2 === 0 && cuttingChai) {
        const cQty = isWeekend ? 4 : 2;
        items.push({
          productId: cuttingChai.id,
          productName: cuttingChai.name,
          quantity: cQty,
          unitPrice: cuttingChai.sellingPrice,
          purchasePrice: cuttingChai.purchasePrice,
          discount: 0,
          tax: 0,
          totalPrice: cQty * cuttingChai.sellingPrice,
        });
      }

      if (b % 3 === 1 && masalaChai) {
        items.push({
          productId: masalaChai.id,
          productName: masalaChai.name,
          quantity: 2,
          unitPrice: masalaChai.sellingPrice,
          purchasePrice: masalaChai.purchasePrice,
          discount: 0,
          tax: 1,
          totalPrice: 2 * masalaChai.sellingPrice,
        });
      }

      if (b % 2 === 1 && bunSamosa) {
        items.push({
          productId: bunSamosa.id,
          productName: bunSamosa.name,
          quantity: snackQty,
          unitPrice: bunSamosa.sellingPrice,
          purchasePrice: bunSamosa.purchasePrice,
          discount: 0,
          tax: 2,
          totalPrice: snackQty * bunSamosa.sellingPrice,
        });
      }

      if (b === 0 && maskabun) {
        items.push({
          productId: maskabun.id,
          productName: maskabun.name,
          quantity: 1,
          unitPrice: maskabun.sellingPrice,
          purchasePrice: maskabun.purchasePrice,
          discount: 0,
          tax: 1,
          totalPrice: maskabun.sellingPrice,
        });
      }

      // Cold coffee only on hot afternoons or weekends
      if ((isWeekend || hour >= 14) && coldCoffee && b % 2 === 0) {
        items.push({
          productId: coldCoffee.id,
          productName: coldCoffee.name,
          quantity: 1,
          unitPrice: coldCoffee.sellingPrice,
          purchasePrice: coldCoffee.purchasePrice,
          discount: 0,
          tax: 3,
          totalPrice: coldCoffee.sellingPrice,
        });
      }

      // Balaji wafers occasional
      if (b % 3 === 2 && wafers) {
        items.push({
          productId: wafers.id,
          productName: wafers.name,
          quantity: 1,
          unitPrice: wafers.sellingPrice,
          purchasePrice: wafers.purchasePrice,
          discount: 0,
          tax: 0,
          totalPrice: wafers.sellingPrice,
        });
      }

      const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
      const tax = items.reduce((sum, it) => sum + it.tax, 0);
      const total = subtotal + tax;

      const methods = ['CASH', 'UPI', 'CASH', 'CARD', 'UPI'];
      const paymentMethod = methods[b % methods.length];

      await prisma.sale.create({
        data: {
          invoiceNumber: `JMRC-ANL-${billCounter}`,
          customerId: customer?.id || null,
          cashierId: user.id,
          subtotal,
          discount: 0,
          tax,
          total,
          paidAmount: total,
          changeAmount: 0,
          paymentMethod,
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          createdAt: currentBillTime,
          updatedAt: currentBillTime,
          items: {
            create: items,
          },
        },
      });
    }
  }

  console.log('Seeded 30 days of realistic sales data successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
