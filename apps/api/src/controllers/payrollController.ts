import { Response } from 'express';
import Payslip from '../models/Payroll';
import Worker from '../models/Worker';
import Attendance from '../models/Attendance';

/**
 * POST /run  [owner/admin]
 * body: { periodFrom, periodTo, workerIds? }
 * For each worker (the given ids or all company workers), aggregate completed
 * attendance within the period and compute a payslip.
 *   - hourly  -> payRate * hoursWorked
 *   - daily   -> payRate * (distinct attendance days in the period)
 *   - monthly -> payRate (flat for the period)
 * net = gross + bonus - deduction
 */
export const runPayroll = async (req: any, res: Response) => {
  try {
    const companyId = req.user.companyId;
    const { periodFrom, periodTo, workerIds } = req.body;

    if (!periodFrom || !periodTo) {
      return res.status(400).json({ message: 'periodFrom and periodTo are required' });
    }

    const from = new Date(periodFrom);
    const to = new Date(periodTo);

    // Worker selection (company-scoped)
    const workerFilter: any = { company: companyId };
    if (Array.isArray(workerIds) && workerIds.length > 0) {
      workerFilter._id = { $in: workerIds };
    }
    const workers = await Worker.find(workerFilter);

    // Attendance dates are stored as 'YYYY-MM-DD' strings — string comparison
    // works for that fixed format, so bound the period by ISO date strings.
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    const payslips: any[] = [];

    for (const worker of workers) {
      const records = await Attendance.find({
        company: companyId,
        worker: worker._id,
        status: 'completed',
        date: { $gte: fromStr, $lte: toStr }
      });

      const hoursWorked = records.reduce((sum, r: any) => sum + (r.hours || 0), 0);
      const overtimeHours = records.reduce((sum, r: any) => sum + (r.overtimeHours || 0), 0);
      const distinctDays = new Set(records.map((r: any) => r.date).filter(Boolean)).size;

      const payType = (worker as any).payType;
      const payRate = (worker as any).payRate || 0;

      let gross = 0;
      if (payType === 'hourly') {
        gross = payRate * hoursWorked;
      } else if (payType === 'daily') {
        gross = payRate * distinctDays;
      } else if (payType === 'monthly') {
        gross = payRate; // flat for the period
      }

      // Preserve any existing bonus/deduction if a payslip already exists for this period
      const existing = await Payslip.findOne({
        company: companyId,
        worker: worker._id,
        periodFrom: from,
        periodTo: to
      });

      const bonus = existing?.bonus || 0;
      const deduction = existing?.deduction || 0;
      const net = gross + bonus - deduction;

      const payslip = await Payslip.findOneAndUpdate(
        { company: companyId, worker: worker._id, periodFrom: from, periodTo: to },
        {
          company: companyId,
          worker: worker._id,
          periodFrom: from,
          periodTo: to,
          hoursWorked,
          overtimeHours,
          payType,
          payRate,
          gross,
          bonus,
          deduction,
          net,
          // Re-running an unpaid period keeps it pending; never reset a paid slip
          ...(existing?.status === 'paid' ? {} : { status: 'pending' })
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      payslips.push(payslip);
    }

    res.status(201).json({ created: payslips.length, payslips });
  } catch (error) {
    console.error('runPayroll error:', error);
    res.status(500).json({ message: 'Failed to run payroll' });
  }
};

/**
 * GET /  list payslips. filters ?worker=&status=
 * Workers may only see their own payslips.
 */
export const getPayslips = async (req: any, res: Response) => {
  try {
    const filter: any = { company: req.user.companyId };

    if (req.user.role === 'worker') {
      filter.worker = req.user.workerId;
    } else if (req.query.worker) {
      filter.worker = req.query.worker;
    }

    if (req.query.status) filter.status = req.query.status;

    const payslips = await Payslip.find(filter)
      .populate('worker', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json(payslips);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payslips' });
  }
};

/**
 * PUT /:id/pay  [owner/admin]  -> mark a payslip paid
 */
export const markPaid = async (req: any, res: Response) => {
  try {
    const payslip = await Payslip.findOneAndUpdate(
      { _id: req.params.id, company: req.user.companyId },
      { status: 'paid', paidAt: new Date() },
      { new: true }
    ).populate('worker', 'name role');

    if (!payslip) return res.status(404).json({ message: 'Payslip not found' });

    res.status(200).json(payslip);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark payslip paid' });
  }
};

/**
 * GET /:id  -> one payslip (company-scoped; workers may only fetch their own)
 */
export const getPayslip = async (req: any, res: Response) => {
  try {
    const filter: any = { _id: req.params.id, company: req.user.companyId };
    if (req.user.role === 'worker') filter.worker = req.user.workerId;

    const payslip = await Payslip.findOne(filter).populate('worker', 'name role');

    if (!payslip) return res.status(404).json({ message: 'Payslip not found' });

    res.status(200).json(payslip);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payslip' });
  }
};
