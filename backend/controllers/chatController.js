import chatModel from "../models/chatModel.js";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Assuming you have access to the Socket.IO instance, potentially passed or imported
// import { io } from '../server.js'; // Example import - adjust based on your server setup

// Get or create a chat between doctor and patient
const getOrCreateChat = async (req, res) => {
  try {
    const { userId, doctorId } = req.body;

    // If this is a doctor request, use docId from auth
    const finalDoctorId = req.body.docId || doctorId;

    if (!finalDoctorId) {
      return res.json({ success: false, message: "Doctor ID is required" });
    }

    console.log("Getting chat with:", { doctorId: finalDoctorId, userId });

    // Validate user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Find existing chat
    let chat = await chatModel
      .findOne({
        doctorId: finalDoctorId,
        userId,
      })
      .populate("messages"); // Ensure messages are populated

    // Get user details for the chat
    const doctorDetails = await doctorModel
      .findById(finalDoctorId)
      .select("name image speciality");
    const userDetails = await userModel.findById(userId).select("name image");

    // If no chat exists, return a temporary chat object without saving to database
    if (!chat) {
      chat = {
        doctorId: finalDoctorId,
        userId,
        messages: [],
        doctor: doctorDetails,
        user: userDetails,
      };
    } else {
      // Format existing chat
      chat = {
        ...chat.toObject(),
        messages: Array.isArray(chat.messages) ? chat.messages : [],
        doctor: doctorDetails,
        user: userDetails,
      };
    }

    console.log("Sending chat data:", {
      chatId: chat._id,
      messageCount: chat.messages.length,
      hasMessages: Array.isArray(chat.messages),
    });

    res.json({
      success: true,
      chat: chat,
    });
  } catch (error) {
    console.error("Error in getOrCreateChat:", error);
    res.json({ success: false, message: error.message });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const {
      userId,
      message,
      senderType,
      doctorId,
      fileUrl,
      fileType,
      content,
    } = req.body;
    const finalDoctorId = req.body.docId || doctorId;

    if (!finalDoctorId) {
      return res.json({ success: false, message: "Doctor ID is required" });
    }

    // Validate sender type
    if (!["doctor", "patient"].includes(senderType)) {
      return res.json({ success: false, message: "Invalid sender type" });
    }

    // Find or create the chat
    let chat = await chatModel.findOne({
      doctorId: finalDoctorId,
      userId,
    });

    if (!chat) {
      // Create new chat only when first message is sent
      chat = new chatModel({
        doctorId: finalDoctorId,
        userId,
        messages: [],
      });
    }

    // Add new message
    const newMessage = {
      content: content || message,
      senderId: senderType === "doctor" ? finalDoctorId : userId,
      senderType: senderType.toLowerCase(),
      timestamp: new Date(),
      fileUrl: fileUrl || null,
      fileType: fileType || null,
    };

    chat.messages.push(newMessage);
    chat.lastMessage = newMessage.timestamp;
    await chat.save();

    req.app.get("socketio").to(chat._id.toString()).emit("receive_message", {
      chatId: chat._id,
      message: newMessage,
    });

    res.json({
      success: true,
      message: newMessage,
      chatId: chat._id,
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get chat history between doctor and user
const getChatHistory = async (req, res) => {
  try {
    const { doctorId, userId } = req.params;
    console.log("Getting chat history for:", { doctorId, userId });

    // If this is a doctor request, use docId from auth
    const finalDoctorId = req.body.docId || doctorId;

    if (!finalDoctorId) {
      return res.json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    const chat = await chatModel
      .findOne({
        doctorId: finalDoctorId,
        userId,
      })
      .populate("messages");

    if (!chat) {
      console.log("No chat found for:", { doctorId: finalDoctorId, userId });
      return res.json({
        success: true,
        messages: [],
      });
    }

    console.log("Found chat with messages:", {
      chatId: chat._id,
      messageCount: chat.messages.length,
    });

    res.json({
      success: true,
      messages: chat.messages || [],
    });
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all chats for a user
const getUserChats = async (req, res) => {
  console.log("--- Executing getUserChats ---");
  try {
    console.log(">>> Inside getUserChats try block <<<");
    const userId = req.body.userId; // Get userId from request body set by auth middleware
    console.log("Fetching chats for user:", userId);

    if (!userId) {
      console.error("No userId provided in request");
      return res.json({ success: false, message: "User ID is required" });
    }

    // Find chats where user is the patient
    const chats = await chatModel.find({ userId });
    console.log("User chats found (raw from DB):", chats);

    // Get user details for each chat
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        try {
          const doctor = await doctorModel
            .findById(chat.doctorId)
            .select("name image speciality available");
          const user = await userModel
            .findById(chat.userId)
            .select("name image");
          console.log("Doctor details:", doctor);
          console.log("User details:", user);
          return {
            ...chat.toObject(),
            doctor,
            user,
          };
        } catch (error) {
          console.error("Error fetching user details:", error);
          return chat.toObject();
        }
      })
    );

    console.log("User chats with details (before sending):", chatsWithDetails);
    console.log("Sending response for user chats:", {
      success: true,
      chats: chatsWithDetails,
    });
    res.json({
      success: true,
      chats: chatsWithDetails,
    });
  } catch (error) {
    console.error("Error in getUserChats:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all chats for a doctor
const getDoctorChats = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log("Fetching chats for doctor:", doctorId);
    console.log("Request params:", req.params);
    console.log("Request user:", req.user);

    if (!doctorId) {
      console.error("No doctorId provided in request params");
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    const chats = await chatModel.find({ doctorId });
    console.log("Doctor chats found:", chats);

    if (!chats || chats.length === 0) {
      console.log("No chats found for doctor:", doctorId);
      return res.json({
        success: true,
        chats: [],
      });
    }

    // Get user details for each chat
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        try {
          const doctor = await doctorModel
            .findById(chat.doctorId)
            .select("name image speciality");
          const user = await userModel
            .findById(chat.userId)
            .select("name image");
          console.log("Doctor details:", doctor);
          console.log("User details:", user);
          return {
            ...chat.toObject(),
            doctor,
            user,
          };
        } catch (error) {
          console.error("Error fetching user details:", error);
          return chat.toObject();
        }
      })
    );

    console.log("Sending response with chats:", chatsWithDetails);
    res.json({
      success: true,
      chats: chatsWithDetails,
    });
  } catch (error) {
    console.error("Error in getDoctorChats:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API to send file in chat
const sendFile = async (req, res) => {
  try {
    const { doctorId, userId, senderType } = req.body;
    const file = req.file;

    if (!file) {
      return res.json({ success: false, message: "No file provided" });
    }

    // Upload file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      folder: "chat_files",
    });

    // Clean up temporary file
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error deleting temporary file:", err);
      }
    });

    // Find or create chat
    let chat = await chatModel.findOne({
      doctorId,
      userId,
    });

    if (!chat) {
      chat = new chatModel({
        doctorId,
        userId,
        messages: [],
      });
    }

    // Add message with file
    const message = {
      content: "",
      senderType,
      timestamp: Date.now(),
      fileUrl: uploadResult.secure_url,
      fileType: file.mimetype,
    };

    chat.messages.push(message);
    await chat.save();

    // Emit message to socket
    req.app.get("socketio").to(chat._id.toString()).emit("receive_message", {
      chatId: chat._id,
      message,
    });

    res.json({
      success: true,
      message: "File sent successfully",
      chatId: chat._id,
    });
  } catch (error) {
    console.error("Error sending file:", error);
    // Clean up temporary file in case of error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Error deleting temporary file:", err);
        }
      });
    }
    res.json({ success: false, message: error.message });
  }
};

export {
  getOrCreateChat,
  sendMessage,
  getChatHistory,
  getUserChats,
  getDoctorChats,
  sendFile,
};
