import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CommunityPost from '../models/CommunityPost';
import CommunityComment from '../models/CommunityComment';
import User from '../models/User';
import Company from '../models/Company';

// @desc    Get all community posts with optional filters
// @route   GET /api/v1/community/posts
// @access  Public
export const getPosts = async (req: Request, res: Response) => {
  try {
    const { category, search, country, city, sortBy } = req.query;
    let filter: any = {};

    if (category) filter.category = category;
    
    let locationConditions = [];
    if (country) locationConditions.push({ location: { $regex: country as string, $options: 'i' } });
    if (city) locationConditions.push({ location: { $regex: city as string, $options: 'i' } });
    
    if (locationConditions.length > 0) {
      filter.$and = locationConditions;
    }

    if (search) {
      const searchRegex = { $regex: search as string, $options: 'i' };
      if (filter.$and) {
        filter.$and.push({ $or: [{ title: searchRegex }, { description: searchRegex }] });
      } else {
        filter.$or = [{ title: searchRegex }, { description: searchRegex }];
      }
    }

    let sortObj: any = { createdAt: -1 };
    if (sortBy === 'helpful') {
      sortObj = { upvotes: -1, createdAt: -1 };
    }

    const posts = await CommunityPost.find(filter)
      .populate('author', 'name companyName') // Assuming user has name/companyName
      .sort(sortObj)
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
      .populate('author', 'name role communityRole isVerifiedExpert reputationScore')
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
    const { title, description, location, category, budget, urgency } = req.body;
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = req.files.map((file: any) => file.path);
    }

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
    const io = req.app.get('io');
    generateAiResponse(newPost, io);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating post" });
  }
};

// Helper function to generate AI response
const generateAiResponse = async (post: any, io: any) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Try to match local companies for service recommendations
    const localCompanies = await Company.find({ 
      $or: [
        { city: { $regex: post.location, $options: 'i' } },
        { state: { $regex: post.location, $options: 'i' } }
      ]
    }).limit(3).lean();

    let companyContext = "";
    if (localCompanies.length > 0) {
      companyContext = `\nWe found some local professionals in ${post.location} that might help:\n` + 
        localCompanies.map(c => `- ${c.name} (ID: ${c._id})`).join('\n') +
        `\nMention these specific companies in your recommendation if relevant. IMPORTANT: When you mention a company, you MUST format it as a markdown link pointing to their marketplace profile like this: [Company Name](/company/THEIR_ID). For example: [${localCompanies[0].name}](/company/${localCompanies[0]._id}). Do NOT use plain text for company names.`;
    }

    const prompt = `
You are an expert construction AI assistant in an African construction forum.
A user has posted a problem. Provide a highly professional, technical, yet easy-to-understand solution.
Recommend next steps, best practices, and suggest finding local experts on the directory. ${companyContext}

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
      
      const populatedAiComment = await aiComment.populate('author', 'name role communityRole isVerifiedExpert reputationScore');
      // Emit real-time event to clients in the post room
      if (io) {
        io.to(`post_${post._id}`).emit('new_community_comment', populatedAiComment);
      }

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
    
    let images: string[] = [];
    let voiceNote: string | undefined = undefined;

    if (req.files && !Array.isArray(req.files)) {
      const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (filesObj['images']) {
        images = filesObj['images'].map(f => f.path);
      }
      if (filesObj['voiceNote'] && filesObj['voiceNote'].length > 0) {
        voiceNote = filesObj['voiceNote'][0].path;
      }
    }

    const newComment = new CommunityComment({
      post: req.params.id,
      author: req.user.id,
      content,
      images,
      voiceNote
    });

    await newComment.save();
    
    // return populated version for immediate UI render
    const populatedComment = await newComment.populate('author', 'name role communityRole isVerifiedExpert reputationScore');
    
    // Emit real-time event to clients in the post room
    const io = req.app.get('io');
    if (io) {
      io.to(`post_${req.params.id}`).emit('new_community_comment', populatedComment);
    }

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
    
    // Increment reputation score for the author
    if (comment && comment.author) {
      const user = await User.findByIdAndUpdate(
        comment.author,
        { $inc: { reputationScore: 1 } },
        { new: true }
      );
      if (user) await checkAndPromoteUser(user);
    }

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

    // Reward the user who provided the solution with +5 reputation
    if (comment.author && !comment.isAi) {
      const user = await User.findByIdAndUpdate(
        comment.author,
        { $inc: { reputationScore: 5 } },
        { new: true }
      );
      if (user) await checkAndPromoteUser(user);
    }

    res.status(200).json({ message: "Solution accepted", comment });
  } catch (error) {
    res.status(500).json({ message: "Error accepting solution" });
  }
};

// Helper function to handle user role promotions
const checkAndPromoteUser = async (user: any) => {
  let newRole = user.communityRole;
  if (user.reputationScore >= 10 && user.reputationScore < 50) {
    newRole = 'Contributor';
  } else if (user.reputationScore >= 50) {
    newRole = 'Expert';
  }

  if (newRole !== user.communityRole) {
    user.communityRole = newRole;
    await user.save();
  }
};
