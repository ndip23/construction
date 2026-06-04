import { Response } from 'express';
import Company from '../models/Company';
import User from '../models/User';
import Worker from '../models/Worker';
import Invoice from '../models/Invoice';
import Tender from '../models/Tender';
import Project from '../models/Project';
import AuditLog from '../models/AuditLog';

/** Record a privileged action to the immutable audit trail. */
const writeAudit = async (
  req: any,
  action: string,
  target: { type?: string; id?: string; label?: string },
  metadata?: any,
) => {
  try {
    await AuditLog.create({
      actor: req.user.id,
      actorName: req.user.name || req.user.email,
      action,
      targetType: target.type,
      targetId: target.id,
      targetLabel: target.label,
      metadata,
      ip: req.ip,
    });
  } catch (e) {
    console.error('[audit] failed to write log:', (e as Error).message);
  }
};

// ── Overview ──────────────────────────────────────────────────────────────
// @route GET /api/v1/superadmin/overview
export const getOverview = async (req: any, res: Response) => {
  try {
    const [
      companiesTotal, verified, pending, rejected, suspended,
      usersTotal, workersTotal, openTenders, projectsTotal,
      gmvAgg, walletAgg,
    ] = await Promise.all([
      Company.countDocuments({}),
      Company.countDocuments({ status: 'verified' }),
      Company.countDocuments({ status: 'pending' }),
      Company.countDocuments({ status: 'rejected' }),
      Company.countDocuments({ isSuspended: true }),
      User.countDocuments({}),
      Worker.countDocuments({}),
      Tender.countDocuments({ status: 'Open' }),
      Project.countDocuments({}),
      Invoice.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Company.aggregate([{ $group: { _id: null, total: { $sum: '$walletBalance' } } }]),
    ]);

    res.status(200).json({
      companies: { total: companiesTotal, verified, pending, rejected, suspended },
      users: usersTotal,
      workers: workersTotal,
      openTenders,
      projects: projectsTotal,
      marketplaceGMV: gmvAgg[0]?.total || 0,
      walletFloat: walletAgg[0]?.total || 0,
      systemHealth: '99.9%',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load platform overview.' });
  }
};

// ── Companies ─────────────────────────────────────────────────────────────
// @route GET /api/v1/superadmin/companies
export const listCompanies = async (req: any, res: Response) => {
  try {
    const { search = '', status = '' } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
    const companies = await Company.find(filter)
      .populate('owner', 'name email')
      .select('name slug city country status isSuspended plan walletBalance currency createdAt owner')
      .sort({ createdAt: -1 })
      .limit(500);
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list companies.' });
  }
};

// @route PATCH /api/v1/superadmin/companies/:id/suspend  { suspend: bool, reason }
export const suspendCompany = async (req: any, res: Response) => {
  try {
    const { suspend, reason = '' } = req.body;
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isSuspended: !!suspend, suspendedReason: suspend ? reason : '' },
      { new: true },
    );
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    await writeAudit(req, suspend ? 'company.suspend' : 'company.unsuspend',
      { type: 'Company', id: String(company._id), label: company.name }, { reason });
    res.status(200).json({ message: `Company ${suspend ? 'suspended' : 'reinstated'}.`, company });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update suspension.' });
  }
};

// @route PATCH /api/v1/superadmin/companies/:id/plan  { plan }
export const updateCompanyPlan = async (req: any, res: Response) => {
  try {
    const { plan } = req.body;
    if (!['basic', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan.' });
    }
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    const before = company.plan;
    company.plan = plan;
    await company.save();
    await writeAudit(req, 'company.plan.change',
      { type: 'Company', id: String(company._id), label: company.name }, { from: before, to: plan });
    res.status(200).json({ message: `Plan changed to ${plan}.`, company });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change plan.' });
  }
};

// @route PATCH /api/v1/superadmin/companies/:id/wallet  { type:'credit'|'debit', amount, note }
export const adjustWallet = async (req: any, res: Response) => {
  try {
    const { type, amount, note = '' } = req.body;
    const amt = Number(amount);
    if (!['credit', 'debit'].includes(type) || !(amt > 0)) {
      return res.status(400).json({ message: 'Provide type (credit|debit) and a positive amount.' });
    }
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found.' });

    const delta = type === 'credit' ? amt : -amt;
    const before = company.walletBalance || 0;
    company.walletBalance = before + delta;
    (company.walletHistory as any).push({
      type, amount: amt, currency: company.currency || 'XAF',
      note: note || `Manual ${type} by platform`, transactionId: `ADJ-${Date.now()}`, date: new Date(),
    });
    await company.save();
    await writeAudit(req, 'company.wallet.adjust',
      { type: 'Company', id: String(company._id), label: company.name },
      { type, amount: amt, note, balanceBefore: before, balanceAfter: company.walletBalance });
    res.status(200).json({ message: `Wallet ${type}ed.`, walletBalance: company.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Failed to adjust wallet.' });
  }
};

// ── Users ─────────────────────────────────────────────────────────────────
// @route GET /api/v1/superadmin/users
export const listUsers = async (req: any, res: Response) => {
  try {
    const { search = '', role = '' } = req.query;
    const filter: any = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const users = await User.find(filter)
      .select('name email role company createdAt')
      .populate('company', 'name slug status')
      .sort({ createdAt: -1 })
      .limit(500);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list users.' });
  }
};

// @route PATCH /api/v1/superadmin/users/:id/role  { role }
export const updateUserRole = async (req: any, res: Response) => {
  try {
    const { role } = req.body;
    // superadmin can only be granted via the seed script — never over the API.
    if (!['admin', 'owner', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin, owner or staff.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot change a superadmin via the API.' });
    }
    const before = user.role;
    user.role = role;
    await user.save();
    await writeAudit(req, 'user.role.change',
      { type: 'User', id: String(user._id), label: user.email }, { from: before, to: role });
    res.status(200).json({ message: `Role changed to ${role}.`, user: { id: user._id, role } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change role.' });
  }
};

// ── Finance ───────────────────────────────────────────────────────────────
// @route GET /api/v1/superadmin/finance
export const getFinance = async (req: any, res: Response) => {
  try {
    const [byStatus, recent] = await Promise.all([
      Invoice.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
      Invoice.find().sort({ createdAt: -1 }).limit(50)
        .populate('company', 'name slug').select('invoiceNumber totalAmount status createdAt company'),
    ]);
    const summary = { Paid: { count: 0, total: 0 }, Pending: { count: 0, total: 0 }, Overdue: { count: 0, total: 0 } } as any;
    byStatus.forEach((s: any) => { if (summary[s._id]) summary[s._id] = { count: s.count, total: s.total }; });
    res.status(200).json({ summary, recent });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load finance data.' });
  }
};

// ── Audit log ─────────────────────────────────────────────────────────────
// @route GET /api/v1/superadmin/audit
export const getAuditLogs = async (req: any, res: Response) => {
  try {
    const { action = '' } = req.query;
    const filter: any = {};
    if (action) filter.action = action;
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200)
      .populate('actor', 'name email');
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load audit log.' });
  }
};
