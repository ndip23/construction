import express from 'express';
import {
  getTasks,
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getTasks);
router.get('/mine', getMyTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
