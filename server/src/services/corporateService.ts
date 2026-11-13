import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { CorporateAccount, CorporateEmployee, Fleet } from '../../../shared/types.js';

export class CorporateService {
  /**
   * Create a corporate transportation account
   */
  static createCorporateAccount(input: {
    companyName: string;
    registrationNumber: string;
    tinNumber: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
    creditLimitEtb?: number;
    countryCode?: string;
  }): CorporateAccount {
    const id = `corp_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO corporate_accounts (
        id, company_name, registration_number, tin_number, contact_person,
        contact_email, contact_phone, credit_limit_etb, spent_this_month_etb,
        billing_cycle, status, country_code, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'monthly', 'active', ?, ?
      )
    `).run(
      id,
      input.companyName,
      input.registrationNumber,
      input.tinNumber,
      input.contactPerson,
      input.contactEmail,
      input.contactPhone,
      input.creditLimitEtb || 100000.0,
      input.countryCode || 'ET',
      now
    );

    return this.getCorporateById(id)!;
  }

  /**
   * Add employee to corporate allowance roster
   */
  static addEmployee(input: {
    corporateId: string;
    name: string;
    phone: string;
    email: string;
    department: string;
    monthlyAllowanceEtb?: number;
  }): CorporateEmployee {
    const id = `emp_${uuidv4().substring(0, 8)}`;

    db.prepare(`
      INSERT INTO corporate_employees (
        id, corporate_id, name, phone, email, department,
        monthly_allowance_etb, spent_this_month_etb, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0.0, 1)
    `).run(
      id,
      input.corporateId,
      input.name,
      input.phone,
      input.email,
      input.department,
      input.monthlyAllowanceEtb || 5000.0
    );

    return {
      id,
      corporateId: input.corporateId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      department: input.department,
      monthlyAllowanceEtb: input.monthlyAllowanceEtb || 5000.0,
      spentThisMonthEtb: 0.0,
      isActive: true,
    };
  }

  /**
   * Validate and debit corporate allowance for a ride
   */
  static chargeCorporateRide(
    corporateId: string,
    employeePhone: string,
    amountEtb: number
  ): { authorized: boolean; reason?: string } {
    const corp = this.getCorporateById(corporateId);
    if (!corp || corp.status !== 'active') {
      return { authorized: false, reason: 'Corporate account inactive or suspended' };
    }

    if (corp.spentThisMonthEtb + amountEtb > corp.creditLimitEtb) {
      return { authorized: false, reason: 'Corporate monthly credit limit exceeded' };
    }

    const emp = db.prepare(`
      SELECT * FROM corporate_employees
      WHERE corporate_id = ? AND phone = ? AND is_active = 1
    `).get(corporateId, employeePhone) as any;

    if (!emp) {
      return { authorized: false, reason: 'Employee not enrolled in corporate travel policy' };
    }

    if (emp.spent_this_month_etb + amountEtb > emp.monthly_allowance_etb) {
      return { authorized: false, reason: 'Employee monthly travel allowance exceeded' };
    }

    // Debit employee and corporate account
    db.prepare(`
      UPDATE corporate_employees
      SET spent_this_month_etb = spent_this_month_etb + ?
      WHERE id = ?
    `).run(amountEtb, emp.id);

    db.prepare(`
      UPDATE corporate_accounts
      SET spent_this_month_etb = spent_this_month_etb + ?
      WHERE id = ?
    `).run(amountEtb, corporateId);

    return { authorized: true };
  }

  /**
   * Retrieve corporate account by ID
   */
  static getCorporateById(id: string): CorporateAccount | null {
    const row = db.prepare('SELECT * FROM corporate_accounts WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      companyName: row.company_name,
      registrationNumber: row.registration_number,
      tinNumber: row.tin_number,
      contactPerson: row.contact_person,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      creditLimitEtb: row.credit_limit_etb,
      spentThisMonthEtb: row.spent_this_month_etb,
      billingCycle: row.billing_cycle,
      status: row.status,
      countryCode: row.country_code,
      createdAt: row.created_at,
    };
  }

  /**
   * List corporate accounts
   */
  static listCorporates(): CorporateAccount[] {
    const rows = db.prepare('SELECT * FROM corporate_accounts ORDER BY created_at DESC').all() as any[];
    return rows.map((r) => this.getCorporateById(r.id)).filter(Boolean) as CorporateAccount[];
  }

  /**
   * List fleets
   */
  static listFleets(): Fleet[] {
    const rows = db.prepare('SELECT * FROM fleets ORDER BY created_at DESC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      ownerUserId: r.owner_user_id,
      fleetName: r.fleet_name,
      registrationNumber: r.registration_number,
      contactPhone: r.contact_phone,
      totalVehicles: r.total_vehicles,
      totalDrivers: r.total_drivers,
      countryCode: r.country_code,
      cityCode: r.city_code,
      status: r.status,
      createdAt: r.created_at,
    }));
  }
}
