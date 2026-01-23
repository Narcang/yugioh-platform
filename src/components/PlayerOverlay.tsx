"use client";
import React, { useState, useRef, useEffect } from 'react';

interface PlayerOverlayProps {
    name: string;
    isSelf?: boolean;
}

const PlayerOverlay: React.FC<PlayerOverlayProps> = ({ name, isSelf }) => {
    const [lifePoints, setLifePoints] = useState(8000);
    // Simplified Mode: Direct +/- 1000
    // No input field needed as per user request

    return (
        <div
            className="player-overlay"
            onClick={(e) => e.stopPropagation()} // Prevent Full Screen toggle on click
        >
            {/* Top Bar with Name and Life Points */}
            <div className="overlay-header">

                {/* Life Points Counter */}
                <div className="lp-counter">
                    {isSelf && (
                        <button
                            className="lp-btn"
                            onClick={() => setLifePoints(prev => Math.max(0, prev - 1000))}
                            title="-1000 LP"
                        >
                            −
                        </button>
                    )}

                    <div className="lp-value-container">
                        <div className="lp-value">
                            {lifePoints}
                        </div>
                    </div>

                    {isSelf && (
                        <button
                            className="lp-btn"
                            onClick={() => setLifePoints(prev => prev + 1000)}
                            title="+1000 LP"
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
                    </div>

                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                    </button>
                </div>

            </div>

        </div>
    );
};

export default PlayerOverlay;
