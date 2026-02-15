import express from 'express';
import { authDoctor, authUser } from '../middleware/authMiddleware.js';
import authMulti from '../middleware/authMulti.js';
import {
    getDoctorChats,
    getChatHistory,
    sendMessage,
    getOrCreateChat,
    getUserChats
} from '../controllers/chatController.js';

const chatRouter = express.Router();

// Get or create chat 
chatRouter.post('/get-or-create', authMulti, getOrCreateChat);

// Get all chats for a doctor
chatRouter.get('/doctor/:doctorId', authDoctor, getDoctorChats);

// Get all chats for a user
chatRouter.get('/user/chats', authUser, getUserChats);

// Get chat history
chatRouter.get('/history/:doctorId/:userId', authMulti, getChatHistory);

// Send message 
chatRouter.post('/send', authMulti, sendMessage);

export default chatRouter; 