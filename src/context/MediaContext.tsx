"use client";
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { findUltraWideRearCamera, isHandheldDevice } from '@/lib/device';

export type FacingMode = 'user' | 'environment';

/** Quarter turns applied to the outgoing video, so peers see cards upright */
export type VideoRotation = 0 | 90 | 180 | 270;

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
    videoRotation: VideoRotation;
    rotateVideo: () => void;
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
    const [videoRotation, setVideoRotation] = useState<VideoRotation>(0);

    // The deck pages have no video at all, and this provider lives in the root
    // layout: without this, opening a deck would pop a camera permission prompt
    // for nothing.
    const isMediaRoute = usePathname() === '/';
    const hasRequestedMedia = useRef(false);
    const streamRef = useRef<MediaStream | null>(null);

    // Rotating pixels would mean re-encoding the track, so the angle travels to
    // the peers instead and each side rotates on display.
    const rotateVideo = () => {
        setVideoRotation(prev => ((prev + 90) % 360) as VideoRotation);
    };

    /** Browsers may hand us a different camera than requested, so trust the track. */
    const readFacingMode = (stream: MediaStream, fallback: FacingMode): FacingMode => {
        const reported = stream.getVideoTracks()[0]?.getSettings().facingMode;
        return reported === 'environment' || reported === 'user' ? reported : fallback;
    };

    const checkCapabilities = (stream: MediaStream) => {
        const track = stream.getVideoTracks()[0];
        if (!track) return;

        // Not every browser implements getCapabilities, and zoom is optional
        try {
            const capabilities: any = track.getCapabilities?.();
            setZoomCapabilities(capabilities?.zoom ?? null);
        } catch {
            setZoomCapabilities(null);
        }
    };

    /**
     * Pulls the framing back as far as the hardware allows, so a phone over the
     * table catches a whole row of cards instead of two of them.
     *
     * Platforms expose "0.6x" in two unrelated ways: recent Android reports one
     * logical rear camera whose zoom range simply starts below 1, while iOS
     * publishes the ultra-wide lens as a separate device. Both are handled —
     * the lens swap happens in loadDevices, the sub-1x zoom here.
     */
    const widenFraming = async (stream: MediaStream) => {
        const track = stream.getVideoTracks()[0];
        if (!track) return;

        try {
            const zoomRange = (track.getCapabilities?.() as any)?.zoom;
            // A range starting at 1 means the lens cannot go wider than default
            if (typeof zoomRange?.min !== 'number' || zoomRange.min >= 1) return;

            await track.applyConstraints({ advanced: [{ zoom: zoomRange.min }] } as any);
            setZoom(zoomRange.min);
        } catch (err) {
            console.warn('Could not pull the camera back to its widest zoom:', err);
        }
    };

    const loadDevices = async (): Promise<MediaDeviceInfo[]> => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
            setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
            setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
            return devices;
        } catch (err) {
            console.error("Error enumerating devices:", err);
            return [];
        }
    };

    /** Swaps in the dedicated ultra-wide lens when the platform exposes one. */
    const preferUltraWideLens = async (
        devices: MediaDeviceInfo[],
        stream: MediaStream
    ): Promise<MediaStream> => {
        const ultraWide = findUltraWideRearCamera(devices);
        if (!ultraWide) return stream;

        const currentDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId;
        if (ultraWide.deviceId === currentDeviceId) return stream;

        try {
            const wideStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: ultraWide.deviceId } },
                audio: false,
            });
            const wideTrack = wideStream.getVideoTracks()[0];
            if (!wideTrack) return stream;

            stream.getVideoTracks().forEach(track => track.stop());
            setSelectedVideoDeviceId(ultraWide.deviceId);
            return new MediaStream([...stream.getAudioTracks(), wideTrack]);
        } catch (err) {
            console.warn('Ultra-wide lens unavailable, keeping the default camera:', err);
            return stream;
        }
    };

    useEffect(() => {
        const initStream = async () => {
            setIsLoading(true);
            // On phones the useful shot is the table, not the player's face
            const preferRear = isHandheldDevice();

            try {
                // First try requesting both video and audio
                let stream = await navigator.mediaDevices.getUserMedia({
                    video: preferRear ? { facingMode: { ideal: 'environment' } } : true,
                    audio: true
                });

                // Device labels stay blank until permission is granted, so the
                // lens can only be chosen after the first successful request
                const devices = await loadDevices();
                if (preferRear) {
                    stream = await preferUltraWideLens(devices, stream);
                }

                setLocalStream(stream);
                setFacingMode(readFacingMode(stream, preferRear ? 'environment' : 'user'));
                checkCapabilities(stream);
                setIsLoading(false);
                setError(null);

                if (preferRear) await widenFraming(stream);
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
                    await loadDevices();
                } catch (audioErr: any) {
                    console.error("Audio access also failed:", audioErr);
                    setError("Nessun dispositivo rilevato (o permessi negati).");
                    setIsLoading(false);
                }
            }
        };

        if (!isMediaRoute) return;
        if (hasRequestedMedia.current) return;
        hasRequestedMedia.current = true;

        initStream();
    }, [isMediaRoute]);

    useEffect(() => {
        streamRef.current = localStream;
    }, [localStream]);

    useEffect(() => () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
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

            if (kind === 'videoinput') {
                setSelectedVideoDeviceId(deviceId);
                setFacingMode(readFacingMode(newStream, facingMode));
                setZoom(1);
                // Hand-picking a lens should still open it as wide as it goes
                await widenFraming(newStream);
            }
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

            let merged = new MediaStream([...audioTracks, newVideoTrack]);
            setZoom(1);
            setSelectedVideoDeviceId(newVideoTrack.getSettings().deviceId);

            // Going back to the table deserves the widest framing again
            if (next === 'environment') {
                merged = await preferUltraWideLens(videoDevices, merged);
            }

            setLocalStream(merged);
            setIsVideoEnabled(true);
            setFacingMode(readFacingMode(merged, next));
            checkCapabilities(merged);
            setError(null);

            if (next === 'environment') await widenFraming(merged);
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
            // Off the game route nothing is loading, because nothing was asked for.
            isLoading: isMediaRoute && isLoading,
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
            flipCamera,
            videoRotation,
            rotateVideo
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
