import express from 'express';
import { protect } from '../middleware/auth.js';
import { getChatContext, handleChat, clearChatHistory } from '../controllers/chatbotController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get('/context', protect, getChatContext);
router.post('/chat', protect, upload.array('files', 5), handleChat);
router.delete('/history', protect, clearChatHistory);

export default router;
