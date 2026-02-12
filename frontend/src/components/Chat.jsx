import { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000');

const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(new Date(date));
};

const Chat = ({ doctorId, onClose }) => {
    const [chat, setChat] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { userData, backendUrl, token } = useContext(AppContext);

    // State for file preview
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        const messagesContainer = messagesEndRef.current?.parentElement?.parentElement;
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    // Initialize chat
    useEffect(() => {
        const initializeChat = async () => {
            if (!token) return; // Ensure token exists before fetching
            try {
                const response = await axios.post(backendUrl + '/api/user/chat/get-or-create', {
                    doctorId,
                    userId: userData._id
                }, { headers: { token: token } });
                if (response.data.success) {
                    setChat(response.data.chat);
                    // Only join chat room if chat exists in database (has _id)
                    if (response.data.chat._id) {
                        console.log('Attempting to join chat room:', response.data.chat._id);
                        socket.emit('join_chat', response.data.chat._id);
                    }
                    // Scroll to bottom after chat is initialized
                    setTimeout(scrollToBottom, 100);
                } else {
                     console.error('Chat initialization failed - API response:', response.data.message);
                     toast.error(response.data.message || 'Failed to load chat');
                }
            } catch (error) {
                console.error('Error initializing chat:', error);
                toast.error('Failed to load chat');
            } finally {
                setLoading(false);
            }
        };

        initializeChat();

        // Cleanup: leave chat room when component unmounts
        return () => {
            if (chat?._id) {
                console.log('Attempting to leave chat room:', chat._id);
                socket.emit('leave_chat', chat._id);
            } else if (socket) {
                 // Clean up socket listeners if component unmounts before chat is initialized
                 socket.off('receive_message');
            }
        };
    }, [doctorId, userData, backendUrl, token]);

    // Listen for new messages
    useEffect(() => {
        console.log('Setting up receive_message listener...');
        socket.on('receive_message', (data) => {
             console.log('Received message via socket:', data);
            if (data.chatId === chat?._id) {
                console.log('Message is for current chat, updating state.');
                setChat(prev => ({
                    ...prev,
                    messages: [...prev.messages, data.message]
                }));
                // Scroll to bottom when new message is received
                setTimeout(scrollToBottom, 100);
            } else {
                 console.log('Received message for a different chat.', { receivedChatId: data.chatId, currentChatId: chat?._id });
            }
        });

        return () => {
            console.log('Cleaning up receive_message listener...');
            socket.off('receive_message');
        };
    }, [chat?._id]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [chat?.messages]);

    // Handle file selection for preview
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        const fileType = file.type.split('/')[0];
        if (fileType !== 'image' && file.type !== 'application/pdf') {
            toast.error('Only images and PDF files are allowed');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size should be less than 5MB');
            return;
        }

        setSelectedFile(file);
        if (fileType === 'image') {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null); // No preview for non-image files
        }

        setShowFileMenu(false); // Close file menu after selection
         e.target.value = ''; // Reset file input
    };

    // Remove selected file preview
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
         if (fileInputRef.current) { // Reset file input element value
             fileInputRef.current.value = '';
         }
    };

    // Upload selected file to Cloudinary and send message
    const uploadSelectedFileAndSend = async () => {
        if (!selectedFile || !chat || !token || !userData) return;

        setIsUploading(true);
        try {
            // Create form data for Cloudinary upload
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('upload_preset', 'smart_clinic_chat'); 

            // Upload to Cloudinary
            const cloudinaryResponse = await axios.post(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
                formData
            );

            if (cloudinaryResponse.data.secure_url) {
                // Send message with file URL to backend
                const response = await axios.post(
                    backendUrl + '/api/user/chat/send',
                    {
                        doctorId: chat.doctorId,
                        userId: chat.userId,
                        message: '',
                        senderType: 'patient',
                        fileUrl: cloudinaryResponse.data.secure_url,
                        fileType: selectedFile.type
                    },
                    {
                        headers: {
                            token: token,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.success) {
                    setMessage('');
                    handleRemoveFile(); // Clear preview after sending
                    setTimeout(scrollToBottom, 100);
                } else {
                    toast.error(response.data.message || 'Failed to send file');
                }
            } else {
                toast.error('Failed to upload file to Cloudinary');
            }
        } catch (error) {
            console.error('Error sending file:', error);
            toast.error('Failed to send file');
        } finally {
            setIsUploading(false);
        }
    };

    // Send message (text or file)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        console.log('Attempting to send message...');
        console.log('Current userData:', userData);

        if (selectedFile) {
            // If a file is selected, upload and send the file message
            uploadSelectedFileAndSend();
        } else if (message.trim() && chat && token && userData) {
            // If no file is selected and there is text message, send text message
            console.log('All required data available, proceeding to send.');
            try {
                const response = await axios.post(backendUrl + '/api/user/chat/send', {
                    doctorId: chat.doctorId,
                    userId: chat.userId,
                    message: message.trim(),
                    senderType: 'patient' // Since this is the user chat interface
                }, { 
                    headers: { 
                        token: token,
                        'Content-Type': 'application/json'
                    } 
                });

                if (response.data.success) {
                    console.log('Message sent successfully via API.');
                    // If this was the first message and chat was created, update the chat object
                    if (!chat._id && response.data.chatId) {
                        setChat(prev => ({
                            ...prev,
                            _id: response.data.chatId
                        }));
                        socket.emit('join_chat', response.data.chatId);
                    }
                    setMessage('');
                    // Scroll to bottom after sending message
                    setTimeout(scrollToBottom, 100);
                } else {
                    console.error('API Error sending message:', response.data.message);
                    toast.error(response.data.message || 'Failed to send message');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                toast.error('Failed to send message');
            }
        } else {
             // Handle case where no message or file is present
             console.log('Send message aborted: no message text and no file selected.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Failed to load chat</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center">
                    <button
                        onClick={onClose}
                        className="mr-4 text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <img
                        src={chat?.doctor?.image || '/default-avatar.png'}
                        alt={chat?.doctor?.name || 'Doctor'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                    />
                    <div className="ml-3">
                        <h2 className="text-lg font-semibold text-gray-900">{chat?.doctor?.name || 'Doctor'}</h2>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : chat?.messages?.length > 0 ? (
                    <div className="space-y-4">
                        {chat.messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.senderType === 'patient' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 ${
                                        msg.senderType === 'patient'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-900 shadow-sm'
                                    }`}
                                >
                                    {msg.fileUrl && (
                                        <div className="mb-2">
                                            {msg.fileType?.startsWith('image/') ? (
                                                <img
                                                    src={msg.fileUrl}
                                                    alt="Shared image"
                                                    className="max-w-full rounded-lg"
                                                />
                                            ) : msg.fileType === 'application/pdf' ? (
                                                <a
                                                    href={msg.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center text-sm hover:underline"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                    View PDF
                                                </a>
                                            ) : null}
                                        </div>
                                    )}
                                    {msg.content && <p className="text-sm">{msg.content}</p>}
                                    <span className="text-xs opacity-75 mt-1 block">
                                        {formatTime(msg.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-gray-500">No messages yet</p>
                            <p className="text-sm text-gray-400 mt-1">Start the conversation</p>
                        </div>
                    </div>
                )}
            </div>

            {/* File Preview */}
            {selectedFile && (
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-12 h-12 object-cover rounded"
                                />
                            ) : (
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            )}
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveFile}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*,.pdf"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => setShowFileMenu(!showFileMenu)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        {showFileMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Image or PDF
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={(!message.trim() && !selectedFile) || isUploading}
                        className={`ml-2 p-2 rounded-full ${
                            (!message.trim() && !selectedFile) || isUploading
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                        } text-white`}
                    >
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

Chat.propTypes = {
    doctorId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired
};

export default Chat; 