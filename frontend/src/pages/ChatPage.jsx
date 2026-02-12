import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import ChatList from '../components/ChatList';
import Chat from '../components/Chat';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const { userData, token, backendUrl } = useContext(AppContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const doctorId = searchParams.get('doctorId');

    const handleCloseChat = () => {
        setSelectedChat(null);
        navigate('/chat');
    };

    useEffect(() => {
        const initializeChat = async () => {
            console.log('Initializing chat...');
            console.log('userData:', userData);
            console.log('token:', token);
            console.log('backendUrl:', backendUrl);
            console.log('doctorId:', doctorId);

            if (doctorId && userData?._id && token) {
                console.log('All required data available, making API call.');
                try {
                    const response = await axios.post(
                        `${backendUrl}/api/user/chat/get-or-create`,
                        {
                            doctorId,
                            userId: userData._id
                        },
                        { headers: { token: token } }
                    );
                    if (response.data.success) {
                        console.log('Chat initialization successful:', response.data.chat);
                        setSelectedChat(response.data.chat);
                    } else {
                        console.error('Chat initialization failed - API response:', response.data.message);
                        toast.error(response.data.message || 'Failed to load chat');
                    }
                } catch (error) {
                    console.error('Error initializing chat:', error);
                    toast.error('Failed to load chat');
                }
            } else {
                console.log('Missing required data for chat initialization.', { doctorId, userData, token });
                if (!token) {
                    console.log('Token is missing, navigating to login.');
                    navigate('/login');
                }
            }
        };

        initializeChat();
    }, [doctorId, userData, token, backendUrl, navigate]);

    if (!token) {
        return null;
    }

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50">
            {/* Chat List */}
            <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
                    <p className="text-sm text-gray-500 mt-1">Chat with your doctors</p>
                </div>
                <div className="flex-1 min-h-0">
                    <ChatList onSelectChat={setSelectedChat} />
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col h-full items-center bg-gray-50">
                {selectedChat && selectedChat.doctor && selectedChat.user ? (
                    <div className="w-full max-w-4xl h-full border border-gray-300 rounded-lg overflow-hidden shadow-md">
                        <Chat
                            doctorId={selectedChat.doctor._id}
                            onClose={handleCloseChat}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md mx-auto px-4">
                            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No chat selected</h3>
                            <p className="text-gray-500">Select a chat from the list to start messaging with your doctor</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;