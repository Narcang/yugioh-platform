"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isHandheldDevice } from '@/lib/device';

export type FacingMode = 'user' | 'environment';

interface MediaContextType {
    localStream: MediaStream | null;
    isMicMuted: boolean;
    isVideoEnabled: boolean;
    isLoading: boolean;
    error: string | null;
    videoDevices: MediaDeviceInfo[];
    audioInputDevices: MediaDeviceInfo[];
    audioOutputDevices: MediaDeviceInfo[];
    selectedVideoDeviceId: string | undefined;
    selectedAudioInputDeviceId: string | undefined;
    selectedAudioOutputDeviceId: string | undefined;
    toggleMic: () => void;
    toggleVideo: () => void;
    changeDevice: (kind: MediaDeviceKind, deviceId: string) => Promise<void>;
    zoom: number;
    setZoomLevel: (level: number) => Promise<void>;
    zoomCapabilities: { min: number, max: number, step: number } | null;
    facingMode: FacingMode;
    hasMultipleCameras: boolean;
    flipCamera: () => Promise<void>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);

    const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>();
    const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] = useState<string>();
    const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState<string>();

    const [zoom, setZoom] = useState(1);
    const [zoomCapabilities, setZoomCapabilities] = useState<{ min: number, max: number, step: number } | null>(null);
    const [facingMode, setFacingMode] = useState<FacingMode>('user');

    /** Browsers may hand us a different camera than requested, so trust the track. */
    const readFacingMode = (stream: MediaStream, fallback: FacingMode): FacingMode => {
        const reported = stream.getVideoTracks()[0]?.getSettings().facingMode;
        return reported === 'environment' || reported === 'user' ? reported : fallback;
    };

    const checkCapabilities = (stream: MediaStream) => {
        const track = stream.getVideoTracks()[0];
        if (!track) return;

        // Use 'any' to bypass TS check for 'capabilities' if needed, or typed if possible
        const capabilities: any = track.getCapabilities();
        if (capabilities && capabilities.zoom) {
            setZoomCapabilities(capabilities.zoom);
        } else {
            setZoomCapabilities(null);
        }
    };

    useEffect(() => {
        const initStream = async () => {
            // On phones the useful shot is the table, not the player's face
            const preferRear = isHandheldDevice();

            try {
                // First try requesting both video and audio
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: preferRear ? { facingMode: { ideal: 'environment' } } : true,
                    audio: true
                });
                setLocalStream(stream);
                setFacingMode(readFacingMode(stream, preferRear ? 'environment' : 'user'));
                checkCapabilities(stream);
                setIsLoading(false);
                setError(null);
            } catch (err: any) {
                console.warn("Camera/Mic access failed, retrying with audio only...", err);

                try {
                    // Fallback: Try audio only (user might not have a camera)
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: true
                    });
                    setLocalStream(audioStream);
                    setIsVideoEnabled(false); // Force video off
                    setIsLoading(false);
                    setError(null); // Clear error if audio works
                } catch (audioErr: any) {
                    console.error("Audio access also failed:", audioErr);
                    setError("Nessun dispositivo rilevato (o permessi negati).");
                    setIsLoading(false);
                }
            }
        };

        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
                setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
                setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
            } catch (err) {
                console.error("Error enumerating devices:", err);
            }
        };

        initStream().then(() => {
            getDevices();
        });

        return () => {
            // Cleanup stream on unmount
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const changeDevice = async (kind: MediaDeviceKind, deviceId: string) => {
        if (kind === 'audiooutput') {
            // Audio output (speaker) handling is different (uses setSinkId on video element usually)
            // For now just update state as React usually handles audio routing implicitly or via ref
            setSelectedAudioOutputDeviceId(deviceId);
            // In a real app with <video>, you'd do videoRef.current.setSinkId(deviceId)
            return;
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: kind === 'videoinput' ? { deviceId: { exact: deviceId } } : isVideoEnabled,
                audio: kind === 'audioinput' ? { deviceId: { exact: deviceId } } : true,
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Stop old tracks to release device
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    // Only stop the track we are replacing to keep the other active if possible?
                    // Actually usually easiest to restart stream.
                    // But if we want to keep state of other track:
                    if (track.kind === (kind === 'videoinput' ? 'video' : 'audio')) {
                        track.stop();
                    }
                });
            }

            // If we replaced one track, we might want to merge with existing other track 
            // OR just replace the whole stream for simplicity in this context
            setLocalStream(newStream);
            if (newStream.getVideoTracks().length > 0) {
                checkCapabilities(newStream);
            }

            if (kind === 'videoinput') setSelectedVideoDeviceId(deviceId);
            if (kind === 'audioinput') setSelectedAudioInputDeviceId(deviceId);

        } catch (err) {
            console.error("Failed to change device:", err);
            setError("Impossibile cambiare dispositivo.");
        }
    };

    const flipCamera = async () => {
        const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment';

        try {
            // 'ideal' rather than 'exact': some phones report odd facing modes
            // and would reject the request outright.
            const camStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: next } },
                audio: false,
            });

            const newVideoTrack = camStream.getVideoTracks()[0];
            if (!newVideoTrack) return;

            // Swap the video track only, so the mic session and mute state survive
            const audioTracks = localStream?.getAudioTracks() ?? [];
            localStream?.getVideoTracks().forEach(track => track.stop());

            const merged = new MediaStream([...audioTracks, newVideoTrack]);
            setLocalStream(merged);
            setIsVideoEnabled(true);
            setFacingMode(readFacingMode(merged, next));
            checkCapabilities(merged);
            setZoom(1);
            setSelectedVideoDeviceId(newVideoTrack.getSettings().deviceId);
            setError(null);
        } catch (err) {
            console.error('Failed to flip camera:', err);
            setError('Impossibile cambiare fotocamera.');
        }
    };

    const setZoomLevel = async (level: number) => {
        if (!localStream) return;
        const track = localStream.getVideoTracks()[0];
        if (!track) return;

        try {
            await track.applyConstraints({
                advanced: [{ zoom: level } as any]
            });
            setZoom(level);
        } catch (err) {
            console.error("Failed to set zoom:", err);
        }
    };

    return (
        <MediaContext.Provider value={{
            localStream,
            isMicMuted,
            isVideoEnabled,
            isLoading,
            error,
            videoDevices,
            audioInputDevices,
            audioOutputDevices,
            selectedVideoDeviceId,
            selectedAudioInputDeviceId,
            selectedAudioOutputDeviceId,
            toggleMic,
            toggleVideo,
            changeDevice,
            zoom,
            setZoomLevel,
            zoomCapabilities,
            facingMode,
            hasMultipleCameras: videoDevices.length > 1,
            flipCamera
        }}>
            {children}
        </MediaContext.Provider>
    );
};

export const useMedia = () => {
    const context = useContext(MediaContext);
    if (context === undefined) {
        throw new Error('useMedia must be used within a MediaProvider');
    }
    return context;
};
