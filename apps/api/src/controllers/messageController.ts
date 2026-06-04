import { Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

// @desc    Get all conversations for the logged-in user (Inbox)
export const getConversations = async (req: any, res: Response) => {
  try {
    const convos = await Conversation.find({ 
      participants: req.user.id 
    })
    .populate('participants', 'name role avatar')
    .sort({ updatedAt: -1 });

    res.status(200).json(convos);
  } catch (error) {
    res.status(500).json({ message: "Failed to load inbox" });
  }
};

// @desc    Get message history for a specific chat
export const getMessages = async (req: any, res: Response) => {
  try {
    const { chatId } = req.params;

    // Verify user is a participant of this chat
    const convo = await Conversation.findById(chatId);
    if (!convo?.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const messages = await Message.find({ conversationId: chatId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to load messages" });
  }
};

// @desc    Save a new message to the database
export const sendMessage = async (req: any, res: Response) => {
  try {
    const { conversationId, text, attachments } = req.body;

    // SECURITY: only a participant may post into a conversation (mirrors getMessages).
    // Without this, any authenticated user could inject messages into another
    // company's chat by passing its conversationId.
    const convo = await Conversation.findById(conversationId);
    if (!convo?.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const newMessage = new Message({
      conversationId,
      sender: req.user.id,
      text,
      attachments
    });

    await newMessage.save();

    // Update the parent conversation with the last message for the sidebar preview
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      updatedAt: Date.now()
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Message could not be saved" });
  }
};