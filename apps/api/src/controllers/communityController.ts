import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CommunityPost from '../models/CommunityPost';
import CommunityComment from '../models/CommunityComment';

// @desc    Get all community posts with optional filters
// @route   GET /api/v1/community/posts
// @access  Public
export const getPosts = async (req: Request, res: Response) => {
  try {
    const { category, location, search } = req.query;
    let filter: any = {};

    if (category) filter.category = category;
    if (location) filter.location = { $regex: location as string, $options: 'i' };
    if (search) {
      const searchRegex = { $regex: search as string, $options: 'i' };
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const posts = await CommunityPost.find(filter)
      .populate('author', 'name companyName') // Assuming user has name/companyName
      .sort({ createdAt: -1 })
      .lean();

    // Attach comment counts
    const postIds = posts.map(p => p._id);
    const commentCounts = await CommunityComment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);

    const countMap = commentCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const enrichedPosts = posts.map((post: any) => ({
      ...post,
      commentCount: countMap[post._id.toString()] || 0
    }));

    res.status(200).json(enrichedPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

// @desc    Get single post and its comments
// @route   GET /api/v1/community/posts/:id
// @access  Public
export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('author', 'name companyName')
      .lean();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Increment views (fire and forget)
    CommunityPost.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

    const comments = await CommunityComment.find({ post: req.params.id })
      .populate('author', 'name role')
      .sort({ upvotes: -1, createdAt: 1 }) // Highest voted first, then chronological
      .lean();

    res.status(200).json({ post, comments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
};

// @desc    Create a new post and auto-reply with AI
// @route   POST /api/v1/community/posts
// @access  Protected
export const createPost = async (req: any, res: Response) => {
  try {
    const { title, description, location, category, budget, urgency, images } = req.body;

    const newPost = new CommunityPost({
      title,
      description,
      location,
      category,
      budget,
      urgency,
      images,
      author: req.user.id // standard req.user
    });

    await newPost.save();

    res.status(201).json(newPost);

    // AI AUTO-SUGGESTION TRIGGER (runs in background)
    generateAiResponse(newPost);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating post" });
  }
};

// Helper function to generate AI response
const generateAiResponse = async (post: any) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert construction AI assistant in an African construction forum.
A user has posted a problem. Provide a highly professional, technical, yet easy-to-understand solution.
Recommend next steps, best practices, and suggest finding local experts on the directory.

Post Details:
Title: ${post.title}
Category: ${post.category}
Location: ${post.location}
Urgency: ${post.urgency}
Description: ${post.description}

Format your response nicely with markdown (bullet points if needed). Be helpful and concise.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (responseText) {
      const aiComment = new CommunityComment({
        post: post._id,
        content: responseText,
        isAi: true,
      });
      await aiComment.save();
    }
  } catch (error) {
    console.error("AI Auto-reply failed:", error);
  }
};

// @desc    Add comment to a post
// @route   POST /api/v1/community/posts/:id/comments
// @access  Protected
export const addComment = async (req: any, res: Response) => {
  try {
    const { content } = req.body;
    const newComment = new CommunityComment({
      post: req.params.id,
      author: req.user.id,
      content
    });

    await newComment.save();
    
    // return populated version for immediate UI render
    const populatedComment = await newComment.populate('author', 'name role');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment" });
  }
};

// @desc    Upvote a post
// @route   PUT /api/v1/community/posts/:id/vote
// @access  Protected
export const votePost = async (req: Request, res: Response) => {
  try {
    // Basic implementation: just increments. In a real app, track user votes to prevent duplicate votes.
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id, 
      { $inc: { upvotes: 1 } }, 
      { new: true }
    );
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error voting" });
  }
};

// @desc    Upvote a comment
// @route   PUT /api/v1/community/comments/:id/vote
// @access  Protected
export const voteComment = async (req: Request, res: Response) => {
  try {
    const comment = await CommunityComment.findByIdAndUpdate(
      req.params.id, 
      { $inc: { upvotes: 1 } }, 
      { new: true }
    );
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Error voting" });
  }
};

// @desc    Accept a comment as solution (only post author can do this)
// @route   PUT /api/v1/community/comments/:id/accept
// @access  Protected
export const acceptSolution = async (req: any, res: Response) => {
  try {
    const comment = await CommunityComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const post = await CommunityPost.findById(comment.post);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Only the author can accept a solution" });
    }

    comment.isAcceptedSolution = true;
    await comment.save();

    post.status = 'Solved';
    await post.save();

    res.status(200).json({ message: "Solution accepted", comment });
  } catch (error) {
    res.status(500).json({ message: "Error accepting solution" });
  }
};
