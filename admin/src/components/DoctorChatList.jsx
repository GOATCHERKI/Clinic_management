import { useState, useEffect, useContext, useMemo } from 'react';
import { DoctorContext } from '../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';

const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(new Date(date));
};

const DoctorChatList = ({ onSelectChat }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { profileData, backendUrl, dToken } = useContext(DoctorContext);

    console.log('DoctorChatList rendered with:', {
        profileData: profileData?._id,
        backendUrl,
        hasToken: !!dToken
    });

    const socket = useMemo(() => {
        if (dToken && profileData?._id) {
            console.log('DoctorChatList: Initializing socket with token and profileData');
            return io(backendUrl || 'http://localhost:4000', {
                auth: {
                    token: dToken
                }
            });
        }
        console.log('DoctorChatList: Deferring socket initialization', { token: !!dToken, profileData: !!profileData?._id });
        return null;
    }, [dToken, profileData?._id, backendUrl]);

    useEffect(() => {
        console.log('DoctorChatList useEffect triggered for fetching chats.');
        console.log('Dependencies for fetchChats useEffect:', { 
            doctorId: profileData?._id, 
            backendUrl: backendUrl, 
            token: !!dToken 
        });
        console.log('useEffect - profileData:', profileData);

        const fetchChats = async () => {
            console.log('Fetching doctor chats...');
            if (!profileData?._id || !dToken) {
                console.log('Missing doctor ID or token inside fetchChats, skipping API call.');
                setLoading(false);
                return;
            }
            
            console.log('--- DoctorChatList: Token value before fetching chats ---', dToken);

            try {
                console.log('Doctor ID and token present inside fetchChats, making API call.');
                setLoading(true);
                const response = await axios.get(
                    `${backendUrl}/api/chat/doctor/${profileData._id}`,
                    {
                        headers: {
                            'dtoken': dToken,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('API Response:', response.data);
                
                if (response.data.success) {
                    console.log('Doctor chats fetched successfully:', response.data.chats);
                    setChats(response.data.chats || []);
                } else {
                    console.error('API Error fetching doctor chats:', response.data.message);
                    toast.error(response.data.message || 'Failed to load doctor chats');
                    setChats([]);
                }
            } catch (error) {
                console.error('Error fetching doctor chats:', error);
                console.error('Error details:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                toast.error('Failed to load doctor chats');
                setChats([]);
            } finally {
                setLoading(false);
            }
        };

        if (profileData?._id && dToken) {
            fetchChats();
        } else {
            console.log('profileData or token not yet available, skipping initial fetch.');
            setLoading(false);
            setChats([]);
        }

    }, [profileData?._id, backendUrl, dToken]);

    useEffect(() => {
        if (!socket) {
            console.log('DoctorChatList: Socket not initialized, skipping listener setup.');
            return;
        }

        console.log('Setting up DoctorChatList receive_message listener...');
        socket.on('receive_message', (data) => {
            console.log('DoctorChatList received message via socket:', data);
            setChats(prevChats => 
                prevChats.map(chat => 
                    chat._id === data.chatId 
                        ? { 
                            ...chat, 
                            messages: [...chat.messages, data.message], 
                            lastMessage: data.message
                          } 
                        : chat
                )
            );
        });

        socket.on('chat_update', (data) => {
            setChats(prevChats => {
                const index = prevChats.findIndex(chat => chat._id === data.chatId);
                if (index === -1) return prevChats;
                
                const newChats = [...prevChats];
                newChats[index] = { ...newChats[index], ...data.updates };
                return newChats;
            });
        });

        return () => {
            console.log('Cleaning up DoctorChatList receive_message listener...');
            if (socket) {
                socket.off('receive_message');
                socket.off('chat_update');
                socket.disconnect();
            }
        };
    }, [socket, chats]);

    console.log('Current chats state:', chats);

    const filteredChats = chats.filter(chat => {
        const userName = chat.user?.name?.toLowerCase() || '';
        const lastMessage = chat.messages?.[chat.messages.length - 1]?.content?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return userName.includes(query) || lastMessage.includes(query);
    });

    if (loading || !dToken) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!chats || chats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-sm font-medium text-gray-900">No chats yet</h3>
                <p className="mt-1 text-sm text-gray-500">Your chat history will appear here</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <svg
                        className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {filteredChats.map((chat) => {
                    const otherUser = chat.user;
                    const lastMessage = chat.messages && chat.messages.length > 0 
                        ? chat.messages[chat.messages.length - 1] 
                        : null;

                    if (!otherUser) return null;

                    return (
                        <button
                            key={chat._id}
                            onClick={() => onSelectChat(chat)}
                            className="w-full p-4 hover:bg-gray-50 border-b border-gray-100 focus:outline-none focus:bg-gray-50 transition-colors duration-150"
                        >
                            <div className="flex items-center">
                                <div className="relative">
                                    <img
                                        src={otherUser.image || '/default-avatar.png'}
                                        alt={otherUser.name || 'User'}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                </div>
                                <div className="ml-3 flex-1 text-left">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-900">{otherUser.name || 'Unknown User'}</h3>
                                        {lastMessage && (
                                            <span className="text-xs text-gray-400">
                                                {formatTime(lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    {lastMessage && (
                                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                            {lastMessage.content || (lastMessage.fileUrl ? '📎 Shared a file' : '')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

DoctorChatList.propTypes = {
    onSelectChat: PropTypes.func.isRequired
};

export default DoctorChatList; 