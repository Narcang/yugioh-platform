"use client";
import React, { useState, useEffect } from 'react';
import { getDefaultLpStep } from '@/lib/gameConfig';

interface PlayerOverlayProps {
    name: string;
    isSelf?: boolean;
    onLpChange?: (lp: number) => void;
    currentLP?: number;
    initialLP?: number;
    teamLabel?: string;
    /** When set, the badge becomes a button that swaps the player's team */
    onTeamToggle?: () => void;
    /** When set, shows a control that turns this player's camera a quarter turn */
    onRotate?: () => void;
    rotation?: number;
}

const PlayerOverlay: React.FC<PlayerOverlayProps> = ({ name, isSelf, onLpChange, currentLP, initialLP = 8000, teamLabel, onTeamToggle, onRotate, rotation = 0 }) => {
    const [lifePoints, setLifePoints] = useState(initialLP);
    const [stepInput, setStepInput] = useState<string>(() => String(getDefaultLpStep(initialLP)));

    const stepValue = parseInt(stepInput) || 0;

    const [isHovered, setIsHovered] = useState(false);

    // Reset when entering a new game / format
    useEffect(() => {
        setLifePoints(initialLP);
        setStepInput(String(getDefaultLpStep(initialLP)));
    }, [initialLP]);

    // Sync from props (Remote updates)
    useEffect(() => {
        if (typeof currentLP !== 'undefined') {
            setLifePoints(currentLP);
        }
    }, [currentLP]);

    const handleLpChange = (delta: 'add' | 'subtract') => {
        if (stepValue <= 0) return;

        setLifePoints(prev => {
            const newVal = delta === 'add' ? prev + stepValue : Math.max(0, prev - stepValue);
            // Broadcast changes
            if (onLpChange) {
                onLpChange(newVal);
            }
            return newVal;
        });
    };

    const handleHalveLP = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLifePoints(prev => {
            const newVal = Math.ceil(prev / 2);
            if (onLpChange) onLpChange(newVal);
            return newVal;
        });
    };

    const handleStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow digits only or empty
        if (val === '' || /^\d+$/.test(val)) {
            setStepInput(val);
        }
    };

    const handleStepBlur = () => {
        // If empty or 0, default to something or keep 0? User wanted flexibility.
        // Let's just ensures it's clean formatted if needed, but '0' is fine if they want to type 500 later.
        if (stepInput === '') {
            setStepInput('0');
        }
    };

    return (
        <div
            className="player-overlay"
            onClick={(e) => e.stopPropagation()} // Prevent Full Screen toggle
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Top Bar with Name and Life Points */}
            <div className="overlay-header">

                {/* Life Points Counter */}
                <div className="lp-counter">
                    {isSelf && (
                        <button
                            className="lp-btn"
                            onClick={() => handleLpChange('subtract')}
                            title={`-${stepInput || 0} LP`}
                        >
                            −
                        </button>
                    )}

                    <div className="lp-value-container" style={{ flexDirection: 'column', gap: '2px' }}>
                        <div className="lp-value">
                            {lifePoints}
                        </div>
                        {/* Custom Step Input (Visible on Hover for Self) */}
                        {isSelf && isHovered && (
                            <div className="controls-row">
                                <div className="step-input-container" title="Change +/- Step">
                                    <span style={{ fontSize: '10px', color: '#888', fontWeight: 600 }}>STEP</span>
                                    <input
                                        type="text"
                                        className="step-input"
                                        value={stepInput}
                                        onChange={handleStepChange}
                                        onBlur={handleStepBlur}
                                        onClick={(e) => e.stopPropagation()}
                                        placeholder="Amount"
                                    />
                                </div>
                                <button
                                    className="halve-btn"
                                    onClick={handleHalveLP}
                                    title="Halve Life Points (½)"
                                >
                                    ½
                                </button>
                            </div>
                        )}
                    </div>

                    {isSelf && (
                        <button
                            className="lp-btn"
                            onClick={() => handleLpChange('add')}
                            title={`+${stepInput || 0} LP`}
                        >
                            +
                        </button>
                    )}
                </div>

                {/* Player Name and Icons */}
                <div className="player-info">
                    <div className="center" style={{ gap: '8px' }}>
                        <span className={isSelf ? 'self-indicator' : 'hidden'}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        </span>
                        <span className="player-name">{name}</span>
                        {teamLabel && (
                            onTeamToggle ? (
                                <button
                                    className="team-badge switchable"
                                    onClick={(e) => { e.stopPropagation(); onTeamToggle(); }}
                                    title="Cambia squadra"
                                >
                                    Team {teamLabel} ⇄
                                </button>
                            ) : (
                                <span className="team-badge">Team {teamLabel}</span>
                            )
                        )}
                    </div>

                    <div className="center" style={{ gap: '4px' }}>
                        {onRotate && (
                            <button
                                className="rotate-btn"
                                onClick={(e) => { e.stopPropagation(); onRotate(); }}
                                title={`Ruota l'inquadratura (${rotation}°). Anche gli avversari la vedranno raddrizzata.`}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
                            </button>
                        )}
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                        </button>
                    </div>
                </div>

            </div>

            <style jsx>{`
                .team-badge {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: rgba(240, 199, 94, 0.15);
                    border: 1px solid rgba(240, 199, 94, 0.4);
                    color: #F0C75E;
                }
                .team-badge.switchable {
                    cursor: pointer;
                    font-family: inherit;
                    transition: background 0.2s, border-color 0.2s;
                }
                .team-badge.switchable:hover {
                    background: rgba(240, 199, 94, 0.35);
                    border-color: #F0C75E;
                }
                .rotate-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    padding: 2px;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .rotate-btn:hover {
                    color: #F0C75E;
                }
                .controls-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: -4px;
                    animation: fadeIn 0.15s ease-out;
                }
                .step-input-container {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(0,0,0,0.6);
                    padding: 3px 8px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: border-color 0.2s;
                }
                .step-input-container:hover {
                    border-color: rgba(255, 255, 255, 0.3);
                }
                .step-input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    font-size: 12px;
                    width: 45px;
                    text-align: center;
                    outline: none;
                    font-family: 'Inter', sans-serif;
                    font-weight: 500;
                }
                .step-input:focus {
                    color: #F0C75E; /* Sand Color */
                }
                .step-input::placeholder {
                    color: #555;
                }
                
                /* Halve Button */
                .halve-btn {
                    background: rgba(0,0,0,0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #ccc;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 10px;
                    font-weight: bold;
                    transition: all 0.2s;
                }
                .halve-btn:hover {
                    background: rgba(240, 199, 94, 0.2); /* Sand Tint */
                    color: #F0C75E;
                    border-color: #F0C75E;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-2px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default PlayerOverlay;
