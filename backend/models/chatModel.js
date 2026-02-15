import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    senderId: {
        type: String,
        required: true
    },
    senderType: {
        type: String,
        enum: ['doctor', 'patient'],
        required: true
    },
    content: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    fileUrl: {
        type: String,
    },
    fileType: {
        type: String,
    }
})

const chatSchema = new mongoose.Schema({
    doctorId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    messages: [messageSchema],
    lastMessage: {
        type: Date,
        default: Date.now
    }
})

const chatModel = mongoose.models.chat || mongoose.model("chat", chatSchema)

export default chatModel 