"use client";
import React, { useRef, useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import type { BoardCard, PlayerBoard } from '@/lib/digitalBoard';
import { onCardImageError } from '@/lib/decks';

interface DigitalFieldProps {
    field: BoardCard[];
    dropId: string;
    readOnly?: boolean;
    onMove?: (instanceId: string, x: number, y: number) => void;
    onReturnToHand?: (instanceId: string) => void;
}

export const DigitalField: React.FC<DigitalFieldProps> = ({
    field,
    dropId,
    readOnly,
    onMove,
    onReturnToHand,
}) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    const relativePos = (clientX: number, clientY: number) => {
        const box = fieldRef.current?.getBoundingClientRect();
        if (!box) return { x: 0.5, y: 0.5 };
        return {
            x: Math.min(1, Math.max(0, (clientX - box.left) / box.width)),
            y: Math.min(1, Math.max(0, (clientY - box.top) / box.height)),
        };
    };

    const handlePointerDown = (event: React.PointerEvent, card: BoardCard) => {
        if (readOnly || !onMove) return;
        event.preventDefault();
        event.stopPropagation();
        const pointerId = event.pointerId;
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(pointerId);

        const move = (ev: PointerEvent) => {
            const { x, y } = relativePos(ev.clientX, ev.clientY);
            onMove(card.instanceId, x, y);
        };
        const up = (ev: PointerEvent) => {
            target.releasePointerCapture(pointerId);
            target.removeEventListener('pointermove', move);
            target.removeEventListener('pointerup', up);
            const under = document.elementFromPoint(ev.clientX, ev.clientY);
            if (onReturnToHand && under?.closest('[data-digital-hand]')) {
                onReturnToHand(card.instanceId);
            }
        };
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerup', up);
    };

    return (
        <div
            ref={fieldRef}
            className="digital-field"
            data-digital-field={dropId}
            onClick={(event) => event.stopPropagation()}
        >
            {field.map((card) => (
                <button
                    key={card.instanceId}
                    type="button"
                    className="digital-field-card"
                    style={{ left: `${(card.x ?? 0.5) * 100}%`, top: `${(card.y ?? 0.5) * 100}%` }}
                    onPointerDown={(e) => handlePointerDown(e, card)}
                    onDoubleClick={() => onReturnToHand?.(card.instanceId)}
                    aria-label={card.name}
                >
                    <img src={card.imageUrl} alt={card.name} draggable={false} onError={onCardImageError} />
                </button>
            ))}
        </div>
    );
};

interface DigitalHandProps {
    board: PlayerBoard;
    onDraw: () => void;
    onDrawExtra: () => void;
    onShuffle: () => void;
    onToGraveyard: (instanceId: string) => void;
    draggingId: string | null;
    setDraggingId: (id: string | null) => void;
    onDropOnField: (instanceId: string, x: number, y: number) => void;
}

export const DigitalHand: React.FC<DigitalHandProps> = ({
    board,
    onDraw,
    onDrawExtra,
    onShuffle,
    onToGraveyard,
    draggingId,
    setDraggingId,
    onDropOnField,
}) => {
    const { t } = useLocale();

    const handlePointerDown = (event: React.PointerEvent, card: BoardCard) => {
        event.preventDefault();
        const pointerId = event.pointerId;
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(pointerId);
        setDraggingId(card.instanceId);

        const ghost = target.cloneNode(true) as HTMLElement;
        ghost.classList.add('digital-card-ghost');
        ghost.style.left = `${event.clientX}px`;
        ghost.style.top = `${event.clientY}px`;
        document.body.appendChild(ghost);

        const move = (ev: PointerEvent) => {
            ghost.style.left = `${ev.clientX}px`;
            ghost.style.top = `${ev.clientY}px`;
        };
        const up = (ev: PointerEvent) => {
            ghost.remove();
            target.releasePointerCapture(pointerId);
            target.removeEventListener('pointermove', move);
            target.removeEventListener('pointerup', up);
            setDraggingId(null);
            const under = document.elementFromPoint(ev.clientX, ev.clientY);
            const field = under?.closest('[data-digital-field="self"]') as HTMLElement | null;
            const gy = under?.closest('[data-digital-gy]');
            if (gy) {
                onToGraveyard(card.instanceId);
                return;
            }
            if (field) {
                const box = field.getBoundingClientRect();
                onDropOnField(
                    card.instanceId,
                    Math.min(1, Math.max(0, (ev.clientX - box.left) / box.width)),
                    Math.min(1, Math.max(0, (ev.clientY - box.top) / box.height)),
                );
            }
        };
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerup', up);
    };

    return (
        <div className="digital-rack" data-digital-hand>
            <div className="digital-piles">
                <button type="button" className="digital-pile" onClick={onDraw} disabled={board.library.length === 0}>
                    <span>{t.play.library}</span>
                    <strong>{board.library.length}</strong>
                    <em>{t.play.draw}</em>
                </button>
                {board.extra.length > 0 && (
                    <button type="button" className="digital-pile" onClick={onDrawExtra}>
                        <span>{t.play.extra}</span>
                        <strong>{board.extra.length}</strong>
                    </button>
                )}
                <button type="button" className="digital-pile" data-digital-gy>
                    <span>{t.play.graveyard}</span>
                    <strong>{board.graveyard.length}</strong>
                </button>
                <button type="button" className="digital-pile ghost" onClick={onShuffle}>
                    {t.play.shuffle}
                </button>
            </div>
            <div className="digital-hand">
                {board.hand.map((card) => (
                    <button
                        key={card.instanceId}
                        type="button"
                        className={`digital-hand-card${draggingId === card.instanceId ? ' dragging' : ''}`}
                        onPointerDown={(e) => handlePointerDown(e, card)}
                        aria-label={card.name}
                    >
                        <img src={card.imageUrl} alt={card.name} draggable={false} onError={onCardImageError} />
                    </button>
                ))}
            </div>
            <p className="digital-hint">{t.play.hint}</p>
        </div>
    );
};
