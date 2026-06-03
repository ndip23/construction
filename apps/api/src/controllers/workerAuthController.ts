import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Worker from '../models/Worker';

// @desc   Worker portal login — PHONE + 4-digit PIN (low-tech, no email)
// @route  POST /api/v1/worker/login   (public)
export const workerLogin = async (req: Request, res: Response) => {
  try {
    const { phone, pin } = req.body || {};
    if (!phone || !pin) {
      return res.status(400).json({ message: 'Phone and PIN are required' });
    }

    // Phones are unique enough for MVP — if multiple match, take the first.
    const worker = await Worker.findOne({ phone, portalEnabled: true }).select('+pin');
    if (!worker || !worker.pin) {
      return res.status(401).json({ message: 'Invalid phone or PIN' });
    }

    const isMatch = await bcrypt.compare(String(pin), worker.pin);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone or PIN' });
    }

    const token = jwt.sign(
      { workerId: worker._id, companyId: worker.company, role: 'worker' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      token,
      worker: { id: worker._id, name: worker.name, role: worker.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Worker login failed' });
  }
};

// @desc   Get the logged-in worker's profile (no PIN)
// @route  GET /api/v1/worker/me   (protect)
export const workerMe = async (req: any, res: Response) => {
  try {
    const workerId = req.user?.workerId;
    if (!workerId) return res.status(401).json({ message: 'Not a worker session' });

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    res.status(200).json(worker);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load worker profile' });
  }
};
