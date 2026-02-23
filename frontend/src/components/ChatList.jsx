import { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
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

const ChatList = ({ onSelectChat }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userData, backendUrl, token } = useContext(AppContext);

    // Create socket instance once per backendUrl
    const socket = useMemo(() => {
        const url = getSocketUrl(backendUrl);
        return io(url, {
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            timeout: 5000
        });
    }, [backendUrl]);

    useEffect(() => {
        console.log('ChatList useEffect triggered.');
        console.log('Dependencies:', { userId: userData?._id, userRole: userData?.role, backendUrl: backendUrl, token: !!token });
        console.log('useEffect - userData:', userData);
        console.log('useEffect - token:', token);

        const fetchChats = async () => {
            console.log('Fetching chats...');
            // Only fetch if userData and token are available
            if (!userData || !token) {
                console.log('Missing user data or token, skipping fetch.');
                setLoading(false);
                return;
            }
            
            try {
                console.log('User data and token present, making API call.');
                setLoading(true); // Set loading to true before fetching
                const endpoint = `${backendUrl}/api/user/chat/chats`;
                
                console.log('API Endpoint:', endpoint);

                const response = await axios.get(endpoint, {
                    headers: { 
                        token: token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.data.success) {
                    console.log('Full API response for chats:', response.data); // Log the full response data
                    console.log('Chats fetched successfully:', response.data.chats);
                    setChats(response.data.chats || []);
                } else {
                     console.error('API Error fetching chats:', response.data.message);
                     toast.error(response.data.message || 'Failed to load chats');
                     setChats([]); // Clear chats on error
                }
            } catch (error) {
                console.error('Error fetching chats:', error);
                toast.error(error.response?.data?.message || 'Failed to load chats');
                setChats([]); // Clear chats on error
            } finally {
                setLoading(false);
            }
        };

        // Call fetchChats only if userData and token are available
        if (userData && token) {
             fetchChats();
        } else {
             console.log('userData or token not yet available, skipping initial fetch.');
             setLoading(false); // Ensure loading is false if not fetching
             setChats([]); // Clear chats if prerequisites are not met
        }

    }, [userData, userData?.role, backendUrl, token]);

    // Listen for new messages via Socket.IO
    useEffect(() => {
        console.log('Setting up ChatList receive_message listener...');
        
        // Handle socket connection events
        socket.on('connect', () => {
            console.log('Socket connected successfully');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socket.on('receive_message', (data) => {
            console.log('ChatList received message via socket:', data);
            setChats(prevChats => 
                prevChats.map(chat => 
                    chat._id === data.chatId 
                        ? { 
                            ...chat, 
                            messages: [...chat.messages, data.message], 
                            lastMessage: data.message.timestamp // Update last message timestamp
                          } 
                        : chat
                )
            );
        });

        return () => {
            console.log('Cleaning up ChatList receive_message listener...');
            socket.off('receive_message');
            socket.off('connect');
            socket.off('connect_error');
            socket.disconnect(); // Disconnect socket on cleanup
        };
    }, [socket]); // Dependency on socket instance

    console.log('Current chats state:', chats);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!chats || chats.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-500">No chats found</p>
                    <p className="text-sm text-gray-400 mt-1">Start a conversation with your doctor</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            {chats.map((chat) => {
                console.log('Processing chat:', chat);
                
                // Get the doctor since user is always patient
                const doctor = chat.doctor;
                console.log('Doctor:', doctor);
                
                // Get the last message if it exists
                const lastMessage = chat.messages && chat.messages.length > 0 
                    ? chat.messages[chat.messages.length - 1] 
                    : null;
                console.log('Last message:', lastMessage);

                return (
                    <button
                        key={chat._id}
                        onClick={() => onSelectChat(chat)}
                        className="w-full p-4 hover:bg-gray-50 border-b focus:outline-none focus:bg-gray-50 transition-colors duration-150"
                    >
                        <div className="flex items-center">
                            <div className="relative">
                                <img
                                    src={doctor?.image || '/default-avatar.png'}
                                    alt={doctor?.name || 'Doctor'}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                />
                                {/* Online status dot */}
                                <span
                                    className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${
                                        doctor?.available === true ? 'bg-green-400' : 'bg-gray-400'
                                    }`}
                                ></span>
                            </div>
                            <div className="ml-3 flex-1 text-left">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900">{doctor?.name || 'Unknown Doctor'}</h3>
                                    {lastMessage && (
                                        <span className="text-xs text-gray-400">
                                            {formatTime(lastMessage.timestamp)}
                                        </span>
                                    )}
                                </div>
                                {lastMessage && (
                                    <p className="text-sm text-gray-500 truncate max-w-[200px] mt-1">
                                        {lastMessage.content || (lastMessage.fileUrl ? 'Sent an attachment' : '')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

ChatList.propTypes = {
    onSelectChat: PropTypes.func.isRequired
};

export default ChatList; 