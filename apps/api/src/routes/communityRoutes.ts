import express from 'express';
import { 
  getPosts, 
  getPostById, 
  createPost, 
  addComment, 
  votePost, 
  voteComment, 
  acceptSolution 
} from '../controllers/communityController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/posts', getPosts);
router.get('/posts/:id', getPostById);

// Protected routes (require login)
router.use(protect);

router.post('/posts', createPost);
router.post('/posts/:id/comments', addComment);

router.put('/posts/:id/vote', votePost);
router.put('/comments/:id/vote', voteComment);
router.put('/comments/:id/accept', acceptSolution);

export default router;
