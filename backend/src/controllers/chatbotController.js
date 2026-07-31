import { getRoleBasedContext } from '../services/studentDataService.js';
import { generateChatbotResponse, buildGreeting, buildScopeResponse } from '../services/chatbotServiceV2.js';
import ChatHistory from '../models/ChatHistory.js';

function ensureAccess(req, res) {
  const requestedUserId = req.body?.user_id || req.body?.userId;
  if (requestedUserId && String(requestedUserId) !== String(req.user.id)) {
    res.status(403).json({
      status: 'error',
      message: 'You can only access your own data.'
    });
    return false;
  }
  return true;
}

export const getChatContext = async (req, res) => {
  try {
    if (!ensureAccess(req, res)) return;

    const context = await getRoleBasedContext(req.user.id);
    let history = await ChatHistory.findOne({ userId: req.user.id });

    res.status(200).json({
      status: 'success',
      data: {
        greeting: buildGreeting(context),
        profile: {
          name: context.profile.name,
          role: context.profile.role,
        },
        suggestions: context.suggestions || [
          'What can I do?',
          'Show my profile'
        ],
        scopeMessage: buildScopeResponse(context.profile.role),
        history: history ? history.messages : []
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const handleChat = async (req, res) => {
  try {
    if (!ensureAccess(req, res)) return;

    let message = (req.body.message || req.body.question || '').trim();
    const files = req.files || [];
    
    if (!message && files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Message or file is required.'
      });
    }

    // Fetch existing history from DB
    let chatDoc = await ChatHistory.findOne({ userId: req.user.id });
    if (!chatDoc) {
      chatDoc = new ChatHistory({ userId: req.user.id, messages: [] });
    }

    // Extract recent history for context
    const recentHistory = chatDoc.messages.slice(-12).map(m => ({
      role: m.role,
      content: m.content
    }));

    const mode = req.body.mode || req.body.chatMode || null;
    const context = await getRoleBasedContext(req.user.id);
    const answer = await generateChatbotResponse(message, context, recentHistory, files, mode);

    // Save the new user message
    const userMessage = {
      role: 'user',
      content: message || 'Uploaded files for analysis.',
      files: files.map(f => ({ name: f.originalname, type: f.mimetype, size: f.size }))
    };
    
    // Save the assistant response
    const assistantMessage = {
      role: 'assistant',
      content: answer
    };

    chatDoc.messages.push(userMessage);
    chatDoc.messages.push(assistantMessage);
    await chatDoc.save();

    res.status(200).json({
      status: 'success',
      answer,
      reply: answer,
      suggestions: context.suggestions || [
        'What can I do?',
        'Show my profile'
      ]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ userId: req.user.id });
    res.status(200).json({
      status: 'success',
      message: 'Chat history cleared'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
