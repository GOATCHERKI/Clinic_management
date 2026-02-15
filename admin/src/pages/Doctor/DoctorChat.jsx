import { useState, useEffect, useContext } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import Chat from '../../components/Chat';
import DoctorChatList from '../../components/DoctorChatList';

const DoctorChat = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const { profileData, getProfileData } = useContext(DoctorContext);
    const [isLoading, setIsLoading] = useState(true);

    console.log('DoctorChat component rendered. selectedChat:', selectedChat);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                await getProfileData();
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [getProfileData]);

    const handleSelectChat = (chat) => {
        console.log('Selected chat:', chat);
        setSelectedChat(chat);
        console.log('selectedChat state updated to:', chat);
    };

    const handleCloseChat = () => {
        console.log('Closing chat.');
        setSelectedChat(null);
        console.log('selectedChat state updated to: null');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!profileData?._id) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-50">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load profile</h3>
                    <p className="mt-1 text-sm text-gray-500">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50">
            {/* Chat List */}
            <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
                    <p className="text-sm text-gray-500 mt-1">Chat with your patients</p>
                </div>
                <div className="flex-1 min-h-0">
                    <DoctorChatList onSelectChat={handleSelectChat} />
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col h-full items-center bg-gray-50">
                {selectedChat ? (
                    <div className="w-full max-w-4xl h-full border border-gray-300 rounded-lg overflow-hidden shadow-md">
                        <Chat
                            doctorId={profileData._id}
                            userId={selectedChat.userId}
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
                            <p className="text-gray-500">Select a chat from the list to start messaging with your patient</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorChat; 