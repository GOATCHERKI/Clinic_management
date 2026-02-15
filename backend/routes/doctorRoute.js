import express from 'express';
import { loginDoctor, appointmentsDoctor, appointmentCancel, doctorList, changeAvailablity, appointmentComplete, doctorDashboard, doctorProfile, updateDoctorProfile, appointmentConfirm, uploadPrescription, deletePrescription, updateWeeklySchedule } from '../controllers/doctorController.js';
import { getOrCreateChat, sendMessage, getChatHistory, getDoctorChats } from '../controllers/chatController.js';
import authDoctor from '../middleware/authDoctor.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.post("/confirm-appointment", authDoctor, appointmentConfirm)
doctorRouter.get("/list", doctorList)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)
doctorRouter.post("/upload-prescription", authDoctor, uploadPrescription)
doctorRouter.post("/delete-prescription", authDoctor, deletePrescription)
doctorRouter.post("/update-weekly-schedule", authDoctor, updateWeeklySchedule)

// Chat routes for doctors
doctorRouter.post('/chat/get-or-create', authDoctor, getOrCreateChat);
doctorRouter.post('/chat/send', authDoctor, sendMessage);
doctorRouter.get('/chat/history/:doctorId/:userId', authDoctor, getChatHistory);
doctorRouter.get('/chat/chats', authDoctor, getDoctorChats);

export default doctorRouter;