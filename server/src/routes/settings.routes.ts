import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// GET /api/settings
router.get('/', async (_req, res: Response): Promise<any> => {
  try {
    let settings = await prisma.businessSettings.findUnique({ where: { id: 'default_settings' } });
    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
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
    }
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve business settings.' });
  }
});

// PUT /api/settings (Admin only)
router.put('/', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      shopName,
      tagline,
      address,
      phone,
      email,
      gstNumber,
      invoicePrefix,
      startInvoiceNumber,
      defaultTaxRate,
      defaultReceiptWidth,
      allowNegativeStock,
      lowStockThreshold,
      minAgeForRestricted,
      enableAgeVerification,
      currencySymbol,
    } = req.body;

    const updated = await prisma.businessSettings.upsert({
      where: { id: 'default_settings' },
      update: {
        ...(shopName && { shopName: shopName.trim() }),
        ...(tagline !== undefined && { tagline }),
        ...(address && { address: address.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(invoicePrefix && { invoicePrefix: invoicePrefix.trim().toUpperCase() }),
        ...(startInvoiceNumber !== undefined && { startInvoiceNumber: Number(startInvoiceNumber) }),
        ...(defaultTaxRate !== undefined && { defaultTaxRate: Number(defaultTaxRate) }),
        ...(defaultReceiptWidth && { defaultReceiptWidth }),
        ...(allowNegativeStock !== undefined && { allowNegativeStock: Boolean(allowNegativeStock) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: Number(lowStockThreshold) }),
        ...(minAgeForRestricted !== undefined && { minAgeForRestricted: Number(minAgeForRestricted) }),
        ...(enableAgeVerification !== undefined && { enableAgeVerification: Boolean(enableAgeVerification) }),
        ...(currencySymbol && { currencySymbol }),
      },
      create: {
        id: 'default_settings',
        shopName: shopName || 'Jay Mataji Rajwadi Chai',
        tagline,
        address: address || 'Ahmedabad, Gujarat',
        phone: phone || '+91 98765 43210',
        email,
        gstNumber,
        invoicePrefix: invoicePrefix || 'JMRC',
        startInvoiceNumber: Number(startInvoiceNumber) || 1001,
        defaultTaxRate: Number(defaultTaxRate) || 5.0,
        defaultReceiptWidth: defaultReceiptWidth || '80mm',
        allowNegativeStock: Boolean(allowNegativeStock),
        lowStockThreshold: Number(lowStockThreshold) || 10,
        minAgeForRestricted: Number(minAgeForRestricted) || 18,
        enableAgeVerification: enableAgeVerification !== undefined ? Boolean(enableAgeVerification) : true,
        currencySymbol: currencySymbol || '₹',
      },
    });

    await createAuditLog({
      action: 'SETTINGS_UPDATE',
      entity: 'SETTINGS',
      entityId: 'default_settings',
      details: req.body,
      req,
    });

    return res.json({ success: true, message: 'Business settings updated successfully.', settings: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

export default router;
