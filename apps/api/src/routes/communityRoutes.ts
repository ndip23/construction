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
import { upload } from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/posts', getPosts);
router.get('/posts/:id', getPostById);

// Protected routes (require login)
router.use(protect);

router.post('/posts', upload.array('images', 5), createPost);
router.post('/posts/:id/comments', upload.fields([{ name: 'images', maxCount: 5 }, { name: 'voiceNote', maxCount: 1 }]), addComment);

router.put('/posts/:id/vote', votePost);
router.put('/comments/:id/vote', voteComment);
router.put('/comments/:id/accept', acceptSolution);

export default router;
