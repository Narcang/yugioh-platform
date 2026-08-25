"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        // Free TURN relay servers (Open Relay) — required for symmetric NAT / mobile networks
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        // Backup free TURN — numb.viagenie.ca
        {
            urls: 'turn:numb.viagenie.ca',
            username: 'webrtc@live.com',
            credential: 'muazkh'
        },
    ]
};

export interface RemotePeer {
    id: string;
    username: string;
    stream: MediaStream | null;
    lifePoints: number | null;
}

interface PeerMeta {
    username: string;
    /** True when this client is responsible for creating offers to that peer */
    isOfferer: boolean;
}

/**
 * Full-mesh WebRTC for 2-4 players.
 *
 * Each client keeps one RTCPeerConnection per remote peer. Supabase Realtime
 * provides presence (who is in the room) and signaling. Every signaling message
 * carries `from`/`to` so peers ignore traffic that is not addressed to them.
 * For each pair the client with the lexicographically smaller id is the offerer,
 * which avoids glare without needing perfect negotiation.
 */
export const useWebRTC = (
    roomId: string | null,
    localStream: MediaStream | null,
    username: string = 'User'
) => {
    const [peers, setPeers] = useState<RemotePeer[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    const clientId = useRef(Math.random().toString(36).substring(2, 10));
    const channel = useRef<RealtimeChannel | null>(null);
    const isSubscribed = useRef(false);

    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map());
    const peerMeta = useRef<Map<string, PeerMeta>>(new Map());
    const iceQueues = useRef<Map<string, RTCIceCandidate[]>>(new Map());

    const localStreamRef = useRef<MediaStream | null>(null);
    const usernameRef = useRef(username);
    usernameRef.current = username;

    const [latestReceivedCard, setLatestReceivedCard] = useState<any | null>(null);
    const [latestReceivedPhase, setLatestReceivedPhase] = useState<string | null>(null);
    const [latestReceivePassTurn, setLatestReceivePassTurn] = useState<number | null>(null);

    // DEBUG STATE
    const [dataChannelState, setDataChannelState] = useState<string>('closed');
    const [iceConnectionState, setIceConnectionState] = useState<string>('new');
    const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        const log = `[${new Date().toLocaleTimeString()}] ${msg}`;
        console.log(log);
        setConnectionLogs(prev => [log, ...prev].slice(0, 50));
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // Peer list helpers
    // ─────────────────────────────────────────────────────────────────
    const upsertPeer = useCallback((id: string, patch: Partial<RemotePeer>) => {
        setPeers(prev => {
            const idx = prev.findIndex(p => p.id === id);
            if (idx === -1) {
                return [...prev, {
                    id,
                    username: patch.username ?? 'Duelist',
                    stream: patch.stream ?? null,
                    lifePoints: patch.lifePoints ?? null,
                }];
            }
            const next = [...prev];
            next[idx] = { ...next[idx], ...patch };
            return next;
        });
    }, []);

    const removePeer = useCallback((id: string) => {
        peerConnections.current.get(id)?.close();
        peerConnections.current.delete(id);
        dataChannels.current.delete(id);
        peerMeta.current.delete(id);
        iceQueues.current.delete(id);
        setPeers(prev => prev.filter(p => p.id !== id));
    }, []);

    const signal = useCallback((event: string, payload: Record<string, unknown>) => {
        channel.current?.send({
            type: 'broadcast',
            event,
            payload: { ...payload, from: clientId.current },
        });
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // Data channel handlers (per peer)
    // ─────────────────────────────────────────────────────────────────
    const setupDataChannel = useCallback((peerId: string, dc: RTCDataChannel) => {
        let keepalive: ReturnType<typeof setInterval> | null = null;

        dc.onopen = () => {
            addLog(`DataChannel open with ${peerId}`);
            setDataChannelState('open');
            keepalive = setInterval(() => {
                if (dc.readyState === 'open') {
                    try { dc.send(JSON.stringify({ type: 'ping', data: Date.now() })); } catch { }
                }
            }, 10000);
        };

        dc.onclose = () => {
            addLog(`DataChannel closed with ${peerId}`);
            if (keepalive) clearInterval(keepalive);
            const anyOpen = Array.from(dataChannels.current.values()).some(c => c.readyState === 'open');
            setDataChannelState(anyOpen ? 'open' : 'closed');
        };

        dc.onmessage = (msg) => {
            try {
                const parsed = JSON.parse(msg.data);
                switch (parsed.type) {
                    case 'ping':
                        return;
                    case 'card-declared':
                        setLatestReceivedCard(parsed.data);
                        break;
                    case 'lp-update':
                        upsertPeer(peerId, { lifePoints: parsed.data });
                        break;
                    case 'phase-update':
                        setLatestReceivedPhase(parsed.data);
                        break;
                    case 'pass-turn':
                        setLatestReceivePassTurn(parsed.data);
                        break;
                }
            } catch { }
        };

        dataChannels.current.set(peerId, dc);
    }, [addLog, upsertPeer]);

    // ─────────────────────────────────────────────────────────────────
    // Create / fetch a peer connection
    // ─────────────────────────────────────────────────────────────────
    const createOffer = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            addLog(`Sending OFFER to ${peerId}`);
            signal('mesh-offer', { to: peerId, offer, username: usernameRef.current });
        } catch (e) {
            addLog(`Error creating OFFER for ${peerId}: ${e}`);
        }
    }, [addLog, signal]);

    const ensurePeerConnection = useCallback((
        peerId: string,
        peerUsername: string,
        isOfferer: boolean
    ): RTCPeerConnection => {
        const existing = peerConnections.current.get(peerId);
        if (existing) return existing;

        addLog(`Creating PeerConnection with ${peerId} (${isOfferer ? 'offerer' : 'answerer'})`);
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnections.current.set(peerId, pc);
        peerMeta.current.set(peerId, { username: peerUsername, isOfferer });
        iceQueues.current.set(peerId, []);
        upsertPeer(peerId, { username: peerUsername });

        // Attach local media right away if we already have it
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        pc.ontrack = (event) => {
            addLog(`Track from ${peerId}: ${event.track.kind}`);
            upsertPeer(peerId, { stream: event.streams[0] });
            setIsConnected(true);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                signal('mesh-ice', { to: peerId, candidate: event.candidate });
            }
        };

        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            addLog(`ICE ${peerId}: ${state}`);
            setIceConnectionState(state);
            if (state === 'failed') {
                pc.restartIce();
            } else if (state === 'disconnected') {
                setTimeout(() => {
                    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                        pc.restartIce();
                    }
                }, 2000);
            }
        };

        pc.onconnectionstatechange = () => {
            addLog(`Connection ${peerId}: ${pc.connectionState}`);
            const states = Array.from(peerConnections.current.values()).map(c => c.connectionState);
            setIsConnected(states.some(s => s === 'connected'));
        };

        pc.onnegotiationneeded = async () => {
            const meta = peerMeta.current.get(peerId);
            if (!meta?.isOfferer || !isSubscribed.current) return;
            addLog(`Renegotiating with ${peerId}`);
            await createOffer(peerId, pc);
        };

        if (isOfferer) {
            const dc = pc.createDataChannel('game-events');
            setupDataChannel(peerId, dc);
        } else {
            pc.ondatachannel = (event) => {
                addLog(`DataChannel received from ${peerId}`);
                setupDataChannel(peerId, event.channel);
            };
        }

        return pc;
    }, [addLog, createOffer, setupDataChannel, signal, upsertPeer]);

    // ─────────────────────────────────────────────────────────────────
    // Signaling + presence
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!roomId) return;

        const myId = clientId.current;
        isSubscribed.current = false;
        addLog(`Joining mesh room ${roomId} as ${myId}`);

        const signaling = supabase.channel(`webrtc:${roomId}`, {
            config: { presence: { key: myId } },
        });
        channel.current = signaling;

        const flushIce = async (peerId: string, pc: RTCPeerConnection) => {
            const queue = iceQueues.current.get(peerId) ?? [];
            while (queue.length > 0) {
                const candidate = queue.shift();
                if (candidate) {
                    await pc.addIceCandidate(candidate).catch(e => addLog(`addIceCandidate: ${e}`));
                }
            }
        };

        signaling
            .on('presence', { event: 'sync' }, () => {
                const state = signaling.presenceState<{ username: string }>();
                const presentIds = Object.keys(state).filter(id => id !== myId);
                addLog(`Presence sync — peers: ${presentIds.join(', ') || 'none'}`);

                // New peers: the lower id initiates the offer
                presentIds.forEach(peerId => {
                    const entry = state[peerId]?.[0];
                    const peerUsername = entry?.username ?? 'Duelist';
                    if (peerConnections.current.has(peerId)) {
                        peerMeta.current.set(peerId, {
                            username: peerUsername,
                            isOfferer: peerMeta.current.get(peerId)?.isOfferer ?? false,
                        });
                        upsertPeer(peerId, { username: peerUsername });
                        return;
                    }
                    const iAmOfferer = myId < peerId;
                    const pc = ensurePeerConnection(peerId, peerUsername, iAmOfferer);
                    if (iAmOfferer) {
                        createOffer(peerId, pc);
                    } else {
                        // Ask for an offer explicitly: a broadcast sent the moment we
                        // subscribed may not have reached us yet.
                        signal('mesh-renegotiate', { to: peerId });
                    }
                });

                // Peers that left
                Array.from(peerConnections.current.keys())
                    .filter(id => !presentIds.includes(id))
                    .forEach(id => {
                        addLog(`Peer left: ${id}`);
                        removePeer(id);
                    });
            })
            .on('broadcast', { event: 'mesh-offer' }, async ({ payload }) => {
                if (payload.to !== myId) return;
                const peerId = payload.from as string;
                try {
                    addLog(`OFFER from ${peerId}`);
                    const pc = ensurePeerConnection(peerId, payload.username ?? 'Duelist', false);
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                    await flushIce(peerId, pc);
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    signal('mesh-answer', { to: peerId, answer, username: usernameRef.current });
                } catch (e) {
                    addLog(`Error handling OFFER from ${peerId}: ${e}`);
                }
            })
            .on('broadcast', { event: 'mesh-answer' }, async ({ payload }) => {
                if (payload.to !== myId) return;
                const peerId = payload.from as string;
                try {
                    addLog(`ANSWER from ${peerId}`);
                    const pc = peerConnections.current.get(peerId);
                    if (!pc || pc.signalingState === 'stable') return;
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                    await flushIce(peerId, pc);
                    upsertPeer(peerId, { username: payload.username ?? 'Duelist' });
                } catch (e) {
                    addLog(`Error handling ANSWER from ${peerId}: ${e}`);
                }
            })
            .on('broadcast', { event: 'mesh-ice' }, async ({ payload }) => {
                if (payload.to !== myId) return;
                const peerId = payload.from as string;
                const pc = peerConnections.current.get(peerId);
                const candidate = new RTCIceCandidate(payload.candidate);
                if (pc?.remoteDescription?.type) {
                    await pc.addIceCandidate(candidate).catch(e => addLog(`addIceCandidate: ${e}`));
                } else {
                    const queue = iceQueues.current.get(peerId) ?? [];
                    queue.push(candidate);
                    iceQueues.current.set(peerId, queue);
                }
            })
            // Offer request: used both when an answerer adds tracks later (it cannot
            // renegotiate itself) and when it joins and needs the first offer.
            .on('broadcast', { event: 'mesh-renegotiate' }, async ({ payload }) => {
                if (payload.to !== myId) return;
                const peerId = payload.from as string;
                if (myId >= peerId) return; // not the offerer for this pair

                const pc = ensurePeerConnection(
                    peerId,
                    peerMeta.current.get(peerId)?.username ?? 'Duelist',
                    true
                );
                // Avoid piling up offers while one is already in flight
                if (pc.signalingState === 'have-local-offer') return;
                await createOffer(peerId, pc);
            })
            // Supabase fallback for game state when a DataChannel is not ready
            .on('broadcast', { event: 'card-declared' }, ({ payload }) => {
                if (payload.from === myId) return;
                setLatestReceivedCard(payload.data);
            })
            .on('broadcast', { event: 'lp-update' }, ({ payload }) => {
                if (payload.from === myId) return;
                upsertPeer(payload.from, { lifePoints: payload.data });
            })
            .on('broadcast', { event: 'phase-update' }, ({ payload }) => {
                if (payload.from === myId) return;
                setLatestReceivedPhase(payload.data);
            })
            .on('broadcast', { event: 'pass-turn' }, ({ payload }) => {
                if (payload.from === myId) return;
                setLatestReceivePassTurn(payload.data);
            })
            .subscribe(async (status) => {
                addLog(`Supabase: ${status}`);
                if (status === 'SUBSCRIBED') {
                    isSubscribed.current = true;
                    await signaling.track({ username: usernameRef.current });
                }
            });

        return () => {
            addLog('Cleaning up mesh...');
            isSubscribed.current = false;
            peerConnections.current.forEach(pc => pc.close());
            peerConnections.current.clear();
            dataChannels.current.clear();
            peerMeta.current.clear();
            iceQueues.current.clear();
            setPeers([]);
            setIsConnected(false);
            supabase.removeChannel(signaling);
            channel.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // ─────────────────────────────────────────────────────────────────
    // Attach local tracks to every peer when the stream becomes available
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        localStreamRef.current = localStream;
        if (!localStream) return;

        const tracks = localStream.getTracks();
        addLog(`LocalStream ready — syncing ${tracks.length} track(s) to ${peerConnections.current.size} peer(s)`);

        peerConnections.current.forEach((pc, peerId) => {
            const senders = pc.getSenders();
            let added = false;

            tracks.forEach(track => {
                const sender = senders.find(s => s.track?.kind === track.kind);
                if (sender) {
                    sender.replaceTrack(track).catch(e => addLog(`replaceTrack: ${e}`));
                } else {
                    pc.addTrack(track, localStream);
                    added = true;
                }
            });

            // Answerers must ask the offerer to renegotiate for the new tracks
            if (added && !peerMeta.current.get(peerId)?.isOfferer) {
                signal('mesh-renegotiate', { to: peerId });
            }
        });
    }, [localStream, addLog, signal]);

    // ─────────────────────────────────────────────────────────────────
    // Game state broadcast (data channels, Supabase as fallback)
    // ─────────────────────────────────────────────────────────────────
    const broadcast = useCallback((type: string, data: unknown) => {
        const message = JSON.stringify({ type, data });
        let deliveredToAll = dataChannels.current.size > 0;

        dataChannels.current.forEach(dc => {
            if (dc.readyState === 'open') {
                try { dc.send(message); } catch { deliveredToAll = false; }
            } else {
                deliveredToAll = false;
            }
        });

        if (!deliveredToAll) {
            channel.current?.send({
                type: 'broadcast',
                event: type,
                payload: { from: clientId.current, data },
            }).catch(e => console.error(`Supabase send error (${type}):`, e));
        }
    }, []);

    const sendCard = useCallback((cardData: any) => broadcast('card-declared', cardData), [broadcast]);
    const sendLP = useCallback((lp: number) => broadcast('lp-update', lp), [broadcast]);
    const sendPhase = useCallback((phase: string) => broadcast('phase-update', phase), [broadcast]);
    const sendPassTurn = useCallback(() => broadcast('pass-turn', Date.now()), [broadcast]);

    const sendPing = useCallback(() => broadcast('ping', Date.now()), [broadcast]);

    const reconnect = useCallback(() => {
        addLog('Manual reconnect: restarting ICE on all peers...');
        peerConnections.current.forEach(pc => pc.restartIce());
    }, [addLog]);

    // Backwards-compatible single-opponent view (first remote peer)
    const primaryPeer = peers[0] ?? null;

    return {
        peers,
        isConnected,
        remoteStream: primaryPeer?.stream ?? null,
        remoteUsername: primaryPeer?.username ?? null,
        latestReceivedLP: primaryPeer?.lifePoints ?? null,
        sendCard,
        latestReceivedCard,
        dataChannelState,
        sendLP,
        sendPhase,
        latestReceivedPhase,
        sendPassTurn,
        latestReceivePassTurn,
        iceConnectionState,
        connectionLogs,
        sendPing,
        reconnect,
    };
};
