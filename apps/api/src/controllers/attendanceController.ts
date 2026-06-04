import { Response } from 'express';
import Attendance from '../models/Attendance';

const todayStr = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const resolveWorker = (req: any, fromBody?: any) =>
  req.user.role === 'worker' ? req.user.workerId : fromBody;

export const clockIn = async (req: any, res: Response) => {
  try {
    const worker = resolveWorker(req, req.body.workerId);
    if (!worker) return res.status(400).json({ message: 'workerId is required' });

    const date = todayStr();
    const existing = await Attendance.findOne({
      company: req.user.companyId,
      worker,
      date,
      status: 'active',
    });
    if (existing) {
      return res.status(400).json({ message: 'Worker is already clocked in today' });
    }

    const attendance = await Attendance.create({
      company: req.user.companyId,
      worker,
      project: req.body.projectId || undefined,
      date,
      clockIn: new Date(),
      status: 'active',
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Failed to clock in' });
  }
};

export const clockOut = async (req: any, res: Response) => {
  try {
    const worker = resolveWorker(req, req.body.workerId);
    if (!worker) return res.status(400).json({ message: 'workerId is required' });

    const date = todayStr();
    const attendance = await Attendance.findOne({
      company: req.user.companyId,
      worker,
      date,
      status: 'active',
    });
    if (!attendance) {
      return res.status(404).json({ message: 'No active clock-in found for today' });
    }

    const clockOutTime = new Date();
    const hours = Math.round(
      ((clockOutTime.getTime() - new Date(attendance.clockIn!).getTime()) / 3600000) * 100
    ) / 100;

    attendance.clockOut = clockOutTime;
    attendance.hours = hours;
    attendance.overtimeHours = Math.max(0, hours - 8);
    attendance.status = 'completed';
    await attendance.save();

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Failed to clock out' });
  }
};

export const getAttendance = async (req: any, res: Response) => {
  try {
    const filter: any = { company: req.user.companyId };

    if (req.user.role === 'worker') {
      filter.worker = req.user.workerId;
    } else if (req.query.worker) {
      filter.worker = req.query.worker;
    }

    if (req.query.date) filter.date = req.query.date;
    if (req.query.project) filter.project = req.query.project;

    const records = await Attendance.find(filter)
      .populate('worker', 'name role')
      .populate('project', 'name')
      .sort({ clockIn: -1, createdAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
};

export const getTimesheet = async (req: any, res: Response) => {
  try {
    const worker = req.user.role === 'worker' ? req.user.workerId : req.query.worker;
    if (!worker) return res.status(400).json({ message: 'worker is required' });

    const filter: any = {
      company: req.user.companyId,
      worker,
      status: 'completed',
    };

    const { from, to } = req.query;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const entries = await Attendance.find(filter)
      .populate('worker', 'name role')
      .populate('project', 'name')
      .sort({ date: 1, clockIn: 1 });

    let totalHours = 0;
    let totalOvertime = 0;
    const dates = new Set<string>();

    entries.forEach((e) => {
      totalHours += e.hours || 0;
      totalOvertime += e.overtimeHours || 0;
      if (e.date) dates.add(e.date);
    });

    res.status(200).json({
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertime: Math.round(totalOvertime * 100) / 100,
      days: dates.size,
      entries,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch timesheet' });
  }
};
