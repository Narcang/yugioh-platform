"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useLayout } from '@/context/LayoutContext';
import { useLocale } from '@/context/LocaleContext';
import { newDiceRollId, type DiceRoll } from '@/lib/dice';

interface DiceModalProps {
    selfName: string;
    sendRoll: (roll: DiceRoll) => void;
    latestReceivedRoll: DiceRoll | null;
}

const DiceModal: React.FC<DiceModalProps> = ({ selfName, sendRoll, latestReceivedRoll }) => {
    const { isDiceModalOpen, setIsDiceModalOpen } = useLayout();
    const { t } = useLocale();
    const [roll, setRoll] = useState<DiceRoll | null>(null);
    const [fromRemote, setFromRemote] = useState(false);
    const shownIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!latestReceivedRoll) return;
        if (shownIdRef.current === latestReceivedRoll.id) return;
        shownIdRef.current = latestReceivedRoll.id;
        setRoll(latestReceivedRoll);
        setFromRemote(true);
        setIsDiceModalOpen(true);
    }, [latestReceivedRoll, setIsDiceModalOpen]);

    if (!isDiceModalOpen) return null;

    const handleClose = () => {
        setIsDiceModalOpen(false);
        setRoll(null);
        setFromRemote(false);
    };

    const publish = (next: DiceRoll) => {
        shownIdRef.current = next.id;
        setRoll(next);
        setFromRemote(false);
        sendRoll(next);
    };

    const handleCoinFlip = () => {
        publish({
            id: newDiceRollId(),
            fromName: selfName,
            kind: 'coin',
            value: Math.random() > 0.5 ? 'heads' : 'tails',
        });
    };

    const handleDiceRoll = (sides: number) => {
        publish({
            id: newDiceRollId(),
            fromName: selfName,
            kind: 'dice',
            sides,
            value: Math.floor(Math.random() * sides) + 1,
        });
    };

    const diceOptions = [
        { label: t.play.diceCoin, action: handleCoinFlip },
        { label: 'D4', action: () => handleDiceRoll(4) },
        { label: 'D6', action: () => handleDiceRoll(6) },
        { label: 'D8', action: () => handleDiceRoll(8) },
        { label: 'D10', action: () => handleDiceRoll(10) },
        { label: 'D12', action: () => handleDiceRoll(12) },
        { label: 'D20', action: () => handleDiceRoll(20) },
    ];

    const resultLabel = roll
        ? roll.kind === 'coin'
            ? (roll.value === 'heads' ? t.play.diceHeads : t.play.diceTails)
            : String(roll.value)
        : '';

    const rollKindLabel = roll
        ? roll.kind === 'coin'
            ? t.play.diceCoin
            : `D${roll.sides ?? ''}`
        : '';

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                {roll ? (
                    <div className="dice-result-view">
                        <h2 className="view-title">{t.play.diceResult}</h2>
                        <p className="dice-roll-who">
                            {t.play.diceRolled.replace('{name}', roll.fromName)} {rollKindLabel}
                        </p>

                        <div className="result-display">
                            {roll.kind === 'coin' && (
                                <div className="coin-icon">
                                    {roll.value === 'heads' ? '🪙' : '🏵️'}
                                </div>
                            )}
                            {roll.kind === 'dice' && (
                                <div className="dice-icon">🎲</div>
                            )}
                            <div className="result-value">{resultLabel}</div>
                        </div>

                        <div className="modal-footer-single-btn">
                            <button
                                className="primary-btn"
                                onClick={fromRemote ? handleClose : () => setRoll(null)}
                            >
                                {fromRemote ? t.play.guideClose : t.play.diceBack}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="modal-content" style={{ padding: 0 }}>
                        <div className="settings-group">
                            {diceOptions.map((option, index) => (
                                <div
                                    key={index}
                                    className="settings-item"
                                    onClick={option.action}
                                >
                                    <span className="item-label">{option.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiceModal;
