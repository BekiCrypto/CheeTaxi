import { Router } from 'express';
import { CorporateService } from '../services/corporateService.js';

export const corporateRouter = Router();

/**
 * List corporate accounts
 */
corporateRouter.get('/accounts', (req, res) => {
  const accounts = CorporateService.listCorporates();
  return res.json({ accounts });
});

/**
 * Register corporate account
 */
corporateRouter.post('/accounts', (req, res) => {
  const {
    companyName,
    registrationNumber,
    tinNumber,
    contactPerson,
    contactEmail,
    contactPhone,
    creditLimitEtb,
  } = req.body;

  if (!companyName || !registrationNumber || !tinNumber || !contactEmail) {
    return res.status(400).json({ error: 'Missing mandatory corporate parameters' });
  }

  const account = CorporateService.createCorporateAccount({
    companyName,
    registrationNumber,
    tinNumber,
    contactPerson: contactPerson || 'Authorized Representative',
    contactEmail,
    contactPhone: contactPhone || '+251...',
    creditLimitEtb: Number(creditLimitEtb) || 100000.0,
  });

  return res.status(201).json({ success: true, account });
});

/**
 * Add employee to corporate travel roster
 */
corporateRouter.post('/employees', (req, res) => {
  const { corporateId, name, phone, email, department, monthlyAllowanceEtb } = req.body;
  if (!corporateId || !name || !phone) {
    return res.status(400).json({ error: 'corporateId, name, and phone are required' });
  }

  const employee = CorporateService.addEmployee({
    corporateId,
    name,
    phone,
    email: email || `${phone}@chebelew.et`,
    department: department || 'General',
    monthlyAllowanceEtb: Number(monthlyAllowanceEtb) || 5000.0,
  });

  return res.status(201).json({ success: true, employee });
});

/**
 * List fleet management organizations
 */
corporateRouter.get('/fleets', (req, res) => {
  const fleets = CorporateService.listFleets();
  return res.json({ fleets });
});
