import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { DoctorContext } from '../context/DoctorContext';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';

// Compute Socket.IO base URL (strip trailing "/api" if present)
const getSocketUrl = (backendUrl) => {
    const raw = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    const trimmed = raw.replace(/\/+$/, '');
    return trimmed.replace(/\/api$/, '');
};

const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric', 
        hour12: true
    }).format(new Date(date));
};

const Chat = ({ doctorId, userId, onClose }) => {
    console.log('Chat component rendered with props:', { doctorId, userId });
    const [chat, setChat] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { backendUrl, dToken } = useContext(DoctorContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);

    // Initialize socket with doctor token
    const socket = useMemo(() => {
        if (dToken) {
            const url = getSocketUrl(backendUrl);
            return io(url, {
                auth: {
                    token: dToken
                }
            });
        }
        return null;
    }, [dToken, backendUrl]);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        // Target the messages area div directly which has overflow-y-auto
        const messagesContainer = messagesEndRef.current?.parentElement?.parentElement;
        if (messagesContainer) {
             // Use scrollIntoView on the messagesEndRef element itself for reliable scrolling
             messagesEndRef.current.scrollIntoView({
                 behavior: 'auto'
             });
        }
    };

    // Initialize chat
    useEffect(() => {
        console.log('Chat initialization effect running with:', { doctorId, userId, hasToken: !!dToken });
        const initializeChat = async () => {
            if (!dToken) return; // Ensure token exists before fetching
            console.log('Chat component - dToken before API call:', dToken ? 'Exists' : 'Does not exist', dToken);
            try {
                const response = await axios.post(backendUrl + '/api/chat/get-or-create', {
                    userId,
                    doctorId
                }, { 
                    headers: {
                        'dtoken': dToken,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Chat initialization API response:', response);

                if (response.data.success && response.data.chat && response.data.chat._id) {
                    setChat(response.data.chat);
                    // Join the chat room
                    console.log('Attempting to join chat room:', response.data.chat._id);
                    socket?.emit('join_chat', response.data.chat._id);
                     // Scroll to bottom 
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
            if (chat && socket) {
                console.log('Attempting to leave chat room:', chat._id);
                socket.emit('leave_chat', chat._id);
            }
             if (socket) { // Clean up listener if socket exists even if chat didn't initialize fully
                 socket.off('receive_message');
             }
        };
    }, [doctorId, userId, backendUrl, dToken, socket, chat?._id]); // Added chat._id to dependencies

    // Listen for new messages
    useEffect(() => {
        if (!socket) return;

        console.log('Setting up receive_message listener...');
        socket.on('receive_message', (data) => {
            console.log('Received message via socket:', data);
            if (data.chatId === chat?._id) {
                console.log('Message is for current chat, updating state.');
                console.log('Received socket message object:', data.message); // Log the received message object
                setChat(prev => ({
                    ...prev,
                    messages: [...prev.messages, data.message]
                }));
                 setTimeout(scrollToBottom, 100); // Scroll to bottom when new message is received
            }
        });

        return () => {
            console.log('Cleaning up receive_message listener...');
            socket.off('receive_message');
        };
    }, [chat?._id, socket]);

    // Scroll to bottom when messages 
    useEffect(() => {
        // Use a timeout to ensure DOM updates are processed before scrolling
        const timer = setTimeout(() => {

        }, 0); // Use 0 or a small delay if needed

        return () => clearTimeout(timer);

    }, [chat?.messages, chat]); // Re-run effect when messages array or chat object changes

    // Cleanup for file preview URL
    useEffect(() => {
        return () => {
            if (filePreviewUrl) {
                URL.revokeObjectURL(filePreviewUrl);
            }
        };
    }, [filePreviewUrl]);

     // Handle file selection and preview
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

        // Generate preview URL
        const previewUrl = URL.createObjectURL(file);
        
        setSelectedFile(file);
        setFilePreviewUrl(previewUrl);
        setShowFileMenu(false); // Close menu after selection

        // Reset file input value so the same file can be selected again
        e.target.value = '';
    };

    // Handle removing selected file
    const handleRemoveFile = () => {
        if (filePreviewUrl) {
            URL.revokeObjectURL(filePreviewUrl); // Clean up object URL
        }
        setSelectedFile(null);
        setFilePreviewUrl(null);
         // Reset file input value as well
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        console.log('Attempting to send message...');

        // Check if sending a file or a text message
        if (selectedFile) {
             console.log('Sending file...');
            if (!chat || !dToken) {
                 console.log('Send file aborted due to missing data:', {
                    chat: !!chat,
                    token: !!dToken
                });
                toast.error('Chat not loaded or token missing');
                return;
            }

            setLoading(true); // Show loading indicator while uploading
            try {
                // Create form data for Cloudinary upload
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('upload_preset', 'smart_clinic_chat'); // Make sure this matches your Cloudinary upload preset

                // Upload to Cloudinary
                const cloudinaryResponse = await axios.post(
                    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
                    formData
                );

                if (cloudinaryResponse.data.secure_url) {
                    console.log('File uploaded to Cloudinary:', cloudinaryResponse.data.secure_url);
                    // Send message with file URL and any accompanying text to backend
                    const response = await axios.post(
                        backendUrl + '/api/chat/send', // Use the general chat send endpoint
                        {
                            chatId: chat._id, // Include chatId for existing chat
                            doctorId: chat.doctorId, // Use chat.doctorId
                            userId: chat.userId, // Use chat.userId
                            content: message.trim(), // Include text message content
                            senderType: 'doctor',
                            fileUrl: cloudinaryResponse.data.secure_url,
                            fileType: selectedFile.type
                        },
                        {
                            headers: {
                                'dtoken': dToken, // Use doctor token
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (response.data.success) {
                        console.log('File message sent successfully via API.');
                        console.log('Sent file message object:', response.data.message); // Log the message object sent
                        setMessage(''); // Clear message input
                        handleRemoveFile(); // Clear preview after successful send
                    } else {
                        console.error('API Error sending file message:', response.data.message);
                        toast.error(response.data.message || 'Failed to send file message');
                    }
                } else {
                    toast.error('Failed to upload file to Cloudinary');
                }
            } catch (error) {
                console.error('Error sending file message:', error);
                toast.error('Failed to send file message');
            } finally {
                 setLoading(false); // Hide loading indicator
            }

        } else if (message.trim() && chat && dToken) { // Sending a text message only if no file is selected
             console.log('Sending text message...');
            if (!message.trim() || !chat || !dToken) {
                 console.log('Send text message aborted due to missing data:', {
                    message: message.trim(),
                    chat: !!chat,
                    token: !!dToken
                });
                return;
            }

            console.log('All required data available, proceeding to send.');
            setLoading(true); // Show loading indicator
            try {
                const response = await axios.post(backendUrl + '/api/chat/send', { // Use the general chat send endpoint
                    chatId: chat._id,
                    doctorId: doctorId,
                    userId: userId,
                    content: message.trim(), // Use 'content' field for text messages
                    senderType: 'doctor' // Doctor is sending the message
                }, {
                    headers: {
                        'dtoken': dToken, // Use doctor token
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    console.log('Text message sent successfully via API.');
                    setMessage('');
                } else {
                    console.error('API Error sending text message:', response.data.message);
                    toast.error(response.data.message || 'Failed to send message');
                }
            } catch (error) {
                console.error('Error sending text message:', error);
                toast.error('Failed to send message');
            } finally {
                 setLoading(false); // Hide loading indicator
            }
        } else {
             // Handle case where no message text and no file is present
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
                        src={chat?.user?.image || '/default-avatar.png'}
                        alt={chat?.user?.name || 'Patient'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                    />
                    <div className="ml-3">
                        <h2 className="text-lg font-semibold text-gray-900">{chat?.user?.name || 'Patient'}</h2>

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
                        {chat.messages.map((msg, index) => {
                            console.log(`Rendering message ${index}:`, { fileUrl: msg.fileUrl, content: msg.content, fileType: msg.fileType }); // Log message data before rendering
                            return (
                                <div
                                    key={index}
                                    className={`flex ${msg.senderType === 'doctor' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${
                                            msg.senderType === 'doctor'
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
                                        {/* Display content if available, otherwise indicate attachment if file is present */}
                                        {msg.content ? (
                                            <p className="text-sm">{msg.content}</p>
                                        ) : msg.fileUrl ? (
                                            <p className="text-sm italic text-gray-200">{msg.fileType?.startsWith('image/') ? 'Sent an image' : 'Sent a PDF'}</p>
                                        ) : null}
                                        <span className="text-xs opacity-75 mt-1 block">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
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
                            {filePreviewUrl ? (
                                <img
                                    src={filePreviewUrl}
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
                        disabled={(!message.trim() && !selectedFile)}
                        className={`ml-2 p-2 rounded-full ${(!message.trim() && !selectedFile) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                    >
                        {loading ? (
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
    userId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired
};

export default Chat; 