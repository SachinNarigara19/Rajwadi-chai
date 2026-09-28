import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import salesRoutes from './routes/sales.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import customerRoutes from './routes/customer.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import reportRoutes from './routes/report.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import auditRoutes from './routes/audit.routes.js';
import backupRoutes from './routes/backup.routes.js';
import searchRoutes from './routes/search.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory for product images
const uploadsPath = path.resolve('uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    system: 'Jay Mataji Rajwadi Chai Shop Management System',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Jay Mataji Rajwadi Chai API] Server running on http://localhost:${PORT}`);
});

export default app;
