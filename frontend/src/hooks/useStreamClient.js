import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import {
    initializeStreamClient,
    disconnectStreamClient,
    isCallAlreadyJoined,
    markCallJoined,
    clearJoinedCall,
} from "../lib/stream";
import { sessionApi } from "../api/sessions";

function useStreamClient(session, loadingSession, isHost, isParticipant) {
    const [streamClient, setStreamClient] = useState(null);
    const [call, setCall] = useState(null);
    const [chatClient, setChatClient] = useState(null);
    const [channel, setChannel] = useState(null);
    const [isInitializingCall, setIsInitializingCall] = useState(true);

    // Use stable primitives as deps — not the whole session object.
    // useSessionById refetches every 5s and creates a new object reference
    // each time, which would re-trigger the effect without this.
    const callId = session?.callId;
    const sessionStatus = session?.status;

    useEffect(() => {
        let videoCall = null;
        let chatClientInstance = null;

        const initCall = async () => {
            if (!callId) return;
            if (!isHost && !isParticipant) return;
            if (sessionStatus === "completed") return;

            // Module-level guard — survives component remounts and hot reloads.
            // useRef resets on every unmount, so we track state at module level instead.
            if (isCallAlreadyJoined(callId)) {
                setIsInitializingCall(false);
                return;
            }

            try {
                const { token, userId, userName, userImage } = await sessionApi.getStreamToken();

                const client = await initializeStreamClient(
                    {
                        id: userId,
                        name: userName,
                        image: userImage,
                    },
                    token
                );

                setStreamClient(client);

                videoCall = client.call("default", callId);
                await videoCall.join({ create: true });

                // Mark as joined at module level before any await that might throw
                markCallJoined(callId);
                setCall(videoCall);

                const apiKey = import.meta.env.VITE_STREAM_API_KEY;
                chatClientInstance = StreamChat.getInstance(apiKey);

                await chatClientInstance.connectUser(
                    {
                        id: userId,
                        name: userName,
                        image: userImage,
                    },
                    token
                );
                setChatClient(chatClientInstance);

                const chatChannel = chatClientInstance.channel("messaging", callId);
                await chatChannel.watch();
                setChannel(chatChannel);
            } catch (error) {
                toast.error("Failed to join video call");
                console.error("Error init call", error);
                // Clear the module-level guard on failure so user can retry
                clearJoinedCall();
            } finally {
                setIsInitializingCall(false);
            }
        };

        if (!loadingSession) initCall();

        // Cleanup — only runs when callId changes or component truly unmounts
        return () => {
            (async () => {
                try {
                    if (videoCall) {
                        await videoCall.leave();
                        clearJoinedCall();
                    }
                    if (chatClientInstance) await chatClientInstance.disconnectUser();
                    await disconnectStreamClient();
                } catch (error) {
                    console.error("Cleanup error:", error);
                }
            })();
        };
    }, [callId, sessionStatus, loadingSession, isHost, isParticipant]);

    return {
        streamClient,
        call,
        chatClient,
        channel,
        isInitializingCall,
    };
}

export default useStreamClient;