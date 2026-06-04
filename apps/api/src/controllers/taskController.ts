import { Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import Project from '../models/Project';

// Phase ordering for grouped/sorted listing
const PHASE_ORDER = ['Foundation', 'Structure', 'Roofing', 'Electrical', 'Plumbing', 'Finishing', 'Other'];

/**
 * Recompute a project's overall progress as the rounded average of its tasks'
 * progress and persist it. Scoped to the given company.
 */
const recomputeProjectProgress = async (
  projectId: mongoose.Types.ObjectId | string,
  companyId: mongoose.Types.ObjectId | string
) => {
  if (!projectId) return;
  const tasks = await Task.find({ project: projectId, company: companyId }).select('progress');
  const avg =
    tasks.length === 0
      ? 0
      : Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length);
  await Project.findOneAndUpdate({ _id: projectId, company: companyId }, { progress: avg });
};

// GET /?project= → company-scoped tasks for a project, grouped-friendly sort
export const getTasks = async (req: any, res: Response) => {
  try {
    const { project } = req.query;
    const filter: any = { company: req.user.companyId };
    if (project) filter.project = project;

    const tasks = await Task.find(filter)
      .populate('assignedWorkers', 'name role')
      .lean();

    // Sort by phase order, then by createdAt
    tasks.sort((a, b) => {
      const pa = PHASE_ORDER.indexOf(a.phase);
      const pb = PHASE_ORDER.indexOf(b.phase);
      if (pa !== pb) return pa - pb;
      return new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime();
    });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

// GET /mine → tasks assigned to the logged-in worker (worker portal)
export const getMyTasks = async (req: any, res: Response) => {
  try {
    const workerId = req.user.workerId;
    if (!workerId) return res.status(400).json({ message: 'Not a worker session' });

    const tasks = await Task.find({
      company: req.user.companyId,
      assignedWorkers: workerId,
    })
      .populate('project', 'name')
      .sort({ deadline: 1, createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

// POST / → create a task, then recompute parent project progress
export const createTask = async (req: any, res: Response) => {
  try {
    const { project, title, phase, assignedWorkers, deadline, costEstimate, status, progress } = req.body;
    if (!project || !title) {
      return res.status(400).json({ message: 'project and title are required' });
    }

    const task = new Task({
      company: req.user.companyId,
      project,
      title,
      phase,
      assignedWorkers,
      deadline,
      costEstimate,
      status,
      progress,
    });

    // Keep progress consistent with a 'done' status on creation
    if (task.status === 'done') task.progress = 100;

    await task.save();
    await recomputeProjectProgress(task.project, req.user.companyId);

    const populated = await task.populate('assignedWorkers', 'name role');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task' });
  }
};

// PUT /:id → update a task (status/progress/etc), then recompute project progress
export const updateTask = async (req: any, res: Response) => {
  try {
    const { company, project, ...rest } = req.body;
    const update: any = { ...rest };

    // Auto-complete progress when marked done
    if (update.status === 'done') update.progress = 100;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, company: req.user.companyId },
      update,
      { new: true }
    ).populate('assignedWorkers', 'name role');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    await recomputeProjectProgress(task.project, req.user.companyId);
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// DELETE /:id → delete a task, then recompute project progress
export const deleteTask = async (req: any, res: Response) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      company: req.user.companyId,
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    await recomputeProjectProgress(task.project, req.user.companyId);
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task' });
  }
};
