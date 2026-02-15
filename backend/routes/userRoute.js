import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, uploadMedicalFile, deleteMedicalFile } from '../controllers/userController.js';
import {
    getOrCreateChat,
    sendMessage,
    getChatHistory,
    getUserChats,
} from '../controllers/chatController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)
userRouter.post("/upload-medical-file", authUser, uploadMedicalFile)
userRouter.post("/delete-medical-file", authUser, deleteMedicalFile)


userRouter.post('/chat/get-or-create', authUser, getOrCreateChat);
userRouter.post('/chat/send', authUser, sendMessage);
userRouter.get('/chat/history/:doctorId/:userId', authUser, getChatHistory);
userRouter.get('/chat/chats', authUser, getUserChats);

export default userRouter;