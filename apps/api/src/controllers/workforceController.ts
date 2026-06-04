import { Response } from 'express';
import bcrypt from 'bcryptjs';
import Worker from '../models/Worker';

const PORTAL_FIELDS = ['phone', 'email', 'payType', 'payRate', 'portalEnabled'];

export const addWorker = async (req: any, res: Response) => {
  try {
    const { pin, ...rest } = req.body;
    const data: any = { ...rest, company: req.user.companyId };

    if (pin) {
      data.pin = await bcrypt.hash(String(pin), 10);
      data.portalEnabled = true;
    }

    const worker = new Worker(data);
    await worker.save();

    const obj = worker.toObject();
    delete (obj as any).pin;
    res.status(201).json(obj);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add worker' });
  }
};

export const updateWorker = async (req: any, res: Response) => {
  try {
    const { pin, company, ...rest } = req.body;
    const update: any = { ...rest };

    if (pin) {
      update.pin = await bcrypt.hash(String(pin), 10);
      update.portalEnabled = true;
    }

    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id, company: req.user.companyId },
      update,
      { new: true }
    ).select('-pin');

    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.status(200).json(worker);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update worker' });
  }
};

export const getCompanyWorkers = async (req: any, res: Response) => {
  const workers = await Worker.find({ company: req.user.companyId }).select('-pin');
  res.status(200).json(workers);
};
