import { Company, Invoice, InvoiceStatus } from '@/types';
import smEliteHajjLogo from '@/assets/sm-elite-hajj-logo.jpeg';

// Mock Companies
export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'S M Elite Hajj Limited',
    tagline: 'Your Trusted Hajj & Umrah Partner',
    logo: smEliteHajjLogo,
    email: 'info@smelitehajj.com.bd',
    phone: '+880 1867-666888',
    address: 'B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Digital Dynamics',
    tagline: 'Innovating Your Future',
    logo: undefined,
    email: 'accounts@digitaldynamics.com.bd',
    phone: '+880 1812-987654',
    address: 'Plot 78, Sector 7, Uttara, Dhaka 1230',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'CloudFirst Inc',
    tagline: 'Cloud Solutions Made Simple',
    logo: undefined,
    email: 'finance@cloudfirst.com.bd',
    phone: '+880 1913-456789',
    address: '23/A Dhanmondi R/A, Road 27, Dhaka 1209',
    createdAt: new Date('2024-03-10'),
  },
];

// Helper to calculate invoice status
const calculateStatus = (totalAmount: number, paidAmount: number): InvoiceStatus => {
  if (paidAmount >= totalAmount) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'unpaid';
};

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    companyId: '1',
    clientName: 'Acme Corporation',
    date: new Date('2024-01-20'),
    items: [
      { id: '1', title: 'Web Development Services', amount: 5000 },
      { id: '2', title: 'UI/UX Design', amount: 2500 },
    ],
    installments: [
      { id: '1', amount: 5000, paidDate: new Date('2024-02-01') },
      { id: '2', amount: 2500, paidDate: new Date('2024-02-15') },
    ],
    totalAmount: 7500,
    paidAmount: 7500,
    dueAmount: 0,
    status: 'paid',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    companyId: '1',
    clientName: 'Global Tech Ltd',
    date: new Date('2024-02-05'),
    items: [
      { id: '1', title: 'Mobile App Development', amount: 15000 },
      { id: '2', title: 'Backend API Integration', amount: 5000 },
    ],
    installments: [
      { id: '1', amount: 10000, paidDate: new Date('2024-02-20') },
    ],
    totalAmount: 20000,
    paidAmount: 10000,
    dueAmount: 10000,
    status: 'partial',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    companyId: '2',
    clientName: 'Startup Hub',
    date: new Date('2024-02-15'),
    items: [
      { id: '1', title: 'Consulting Services', amount: 3000 },
      { id: '2', title: 'System Architecture', amount: 4500 },
    ],
    installments: [
      { id: '1', amount: 7500, paidDate: new Date('2024-03-01') },
    ],
    totalAmount: 7500,
    paidAmount: 7500,
    dueAmount: 0,
    status: 'paid',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    companyId: '2',
    clientName: 'Enterprise Solutions',
    date: new Date('2024-03-01'),
    items: [
      { id: '1', title: 'Cloud Migration', amount: 25000 },
      { id: '2', title: 'Training & Support', amount: 5000 },
    ],
    installments: [],
    totalAmount: 30000,
    paidAmount: 0,
    dueAmount: 30000,
    status: 'unpaid',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-005',
    companyId: '3',
    clientName: 'Innovation Labs',
    date: new Date('2024-03-10'),
    items: [
      { id: '1', title: 'AI Integration', amount: 18000 },
      { id: '2', title: 'Data Analytics Setup', amount: 7000 },
    ],
    installments: [
      { id: '1', amount: 12500, paidDate: new Date('2024-03-20') },
    ],
    totalAmount: 25000,
    paidAmount: 12500,
    dueAmount: 12500,
    status: 'partial',
  },
  {
    id: '6',
    invoiceNumber: 'INV-2024-006',
    companyId: '3',
    clientName: 'SmartRetail Co',
    date: new Date('2024-03-25'),
    items: [
      { id: '1', title: 'E-commerce Platform', amount: 35000 },
    ],
    installments: [
      { id: '1', amount: 35000, paidDate: new Date('2024-04-10') },
    ],
    totalAmount: 35000,
    paidAmount: 35000,
    dueAmount: 0,
    status: 'paid',
  },
];

// Calculate revenue stats
export const calculateRevenueStats = (invoices: Invoice[], companies: Company[]) => {
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
  const totalInvoices = invoices.length;

  const companyRevenue = companies.map((company) => {
    const revenue = invoices
      .filter((inv) => inv.companyId === company.id)
      .reduce((sum, inv) => sum + inv.paidAmount, 0);
    return { companyId: company.id, companyName: company.name, revenue };
  }).sort((a, b) => b.revenue - a.revenue);

  // Calculate monthly revenue (last 6 months)
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const revenue = invoices.reduce((sum, inv) => {
      const paidInMonth = inv.installments.filter((inst) => {
        const instDate = new Date(inst.paidDate);
        return instDate.getMonth() === date.getMonth() && instDate.getFullYear() === date.getFullYear();
      }).reduce((s, i) => s + i.amount, 0);
      return sum + paidInMonth;
    }, 0);
    monthlyRevenue.push({ month: monthName, revenue });
  }

  return { totalRevenue, totalDue, totalInvoices, companyRevenue, monthlyRevenue };
};
