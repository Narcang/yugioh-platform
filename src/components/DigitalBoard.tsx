"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '@/context/LocaleContext';
import { useLayout } from '@/context/LayoutContext';
import type { BoardCard, PlayerBoard } from '@/lib/digitalBoard';
import { nextFieldSlot, usesBattlePosition } from '@/lib/digitalBoard';
import { onCardImageError } from '@/lib/decks';

const DRAG_THRESHOLD = 10;

export type FieldPlayOpts = {
    faceDown?: boolean;
    position?: 'attack' | 'defense';
};

function useInspectCard() {
    const { setInspectedCard, setIsCardPanelOpen } = useLayout();
    return (card: BoardCard, hidden?: boolean) => {
        if (hidden || !card.imageUrl) return;
        setInspectedCard({
            instanceId: card.instanceId,
            name: card.name,
            imageUrl: card.imageUrl,
        });
        setIsCardPanelOpen(true);
    };
}

type CardMenu = {
    kind: 'hand' | 'field';
    card: BoardCard;
    x: number;
    y: number;
};

function CardFace({
    card,
    hideIdentity,
    ownerPeek,
}: {
    card: BoardCard;
    hideIdentity: boolean;
    ownerPeek?: boolean;
}) {
    if (hideIdentity && !ownerPeek) {
        return <span className="digital-card-back" aria-hidden />;
    }
    return (
        <>
            <img src={card.imageUrl} alt="" draggable={false} onError={onCardImageError} />
            {ownerPeek && card.faceDown && <span className="digital-card-veil" />}
        </>
    );
}

function CardActionMenu({
    x,
    y,
    children,
    onClose,
}: {
    x: number;
    y: number;
    children: React.ReactNode;
    onClose: () => void;
}) {
    useEffect(() => {
        const close = (event: PointerEvent) => {
            if ((event.target as HTMLElement | null)?.closest('[data-card-menu]')) return;
            onClose();
        };
        window.addEventListener('pointerdown', close);
        return () => window.removeEventListener('pointerdown', close);
    }, [onClose]);

    const width = 220;
    const height = 280;
    const left = Math.min(Math.max(8, x), window.innerWidth - width - 8);
    const top = Math.min(Math.max(8, y), window.innerHeight - height - 8);

    return createPortal(
        <div
            className="digital-card-menu"
            data-card-menu
            style={{ left, top }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
}

interface DigitalFieldProps {
    field: BoardCard[];
    dropId: string;
    readOnly?: boolean;
    gameType?: string;
    onMove?: (instanceId: string, x: number, y: number) => void;
    onReturnToHand?: (instanceId: string) => void;
    onToGraveyard?: (instanceId: string) => void;
    onUpdateCard?: (instanceId: string, patch: FieldPlayOpts) => void;
}

export const DigitalField: React.FC<DigitalFieldProps> = ({
    field,
    dropId,
    readOnly,
    gameType = '',
    onMove,
    onReturnToHand,
    onToGraveyard,
    onUpdateCard,
}) => {
    const { t } = useLocale();
    const inspect = useInspectCard();
    const fieldRef = useRef<HTMLDivElement>(null);
    const [menu, setMenu] = useState<CardMenu | null>(null);
    const battle = usesBattlePosition(gameType);

    const relativePos = (clientX: number, clientY: number) => {
        const box = fieldRef.current?.getBoundingClientRect();
        if (!box) return { x: 0.5, y: 0.5 };
        return {
            x: Math.min(1, Math.max(0, (clientX - box.left) / box.width)),
            y: Math.min(1, Math.max(0, (clientY - box.top) / box.height)),
        };
    };

    const handlePointerDown = (event: React.PointerEvent, card: BoardCard) => {
        event.preventDefault();
        event.stopPropagation();
        const pointerId = event.pointerId;
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        let dragging = false;
        const hidden = Boolean(readOnly && card.faceDown);

        if (readOnly || !onMove) {
            const up = (ev: PointerEvent) => {
                target.releasePointerCapture(pointerId);
                target.removeEventListener('pointerup', up);
                if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) {
                    inspect(card, hidden);
                }
            };
            target.addEventListener('pointerup', up);
            return;
        }

        const move = (ev: PointerEvent) => {
            const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
            if (!dragging && dist < DRAG_THRESHOLD) return;
            dragging = true;
            setMenu(null);
            const { x, y } = relativePos(ev.clientX, ev.clientY);
            onMove(card.instanceId, x, y);
        };
        const up = (ev: PointerEvent) => {
            target.releasePointerCapture(pointerId);
            target.removeEventListener('pointermove', move);
            target.removeEventListener('pointerup', up);
            if (dragging) {
                const under = document.elementFromPoint(ev.clientX, ev.clientY);
                if (onReturnToHand && under?.closest('[data-digital-hand]')) {
                    onReturnToHand(card.instanceId);
                }
                return;
            }
            inspect(card, hidden);
            setMenu({ kind: 'field', card, x: ev.clientX, y: ev.clientY });
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
            {field.map((card) => {
                const defense = card.position === 'defense';
                const hideIdentity = Boolean(readOnly && card.faceDown);
                return (
                    <button
                        key={card.instanceId}
                        type="button"
                        className={`digital-field-card${defense ? ' is-defense' : ''}${card.faceDown ? ' is-facedown' : ''}`}
                        style={{ left: `${(card.x ?? 0.5) * 100}%`, top: `${(card.y ?? 0.5) * 100}%` }}
                        onPointerDown={(e) => handlePointerDown(e, card)}
                        aria-label={hideIdentity ? t.play.cover : card.name}
                    >
                        <CardFace card={card} hideIdentity={hideIdentity} ownerPeek={!readOnly && card.faceDown} />
                    </button>
                );
            })}

            {menu?.kind === 'field' && (() => {
                const pos = menu.card.position ?? 'attack';
                return (
                <CardActionMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
                    <button
                        type="button"
                        onClick={() => {
                            onToGraveyard?.(menu.card.instanceId);
                            setMenu(null);
                        }}
                    >
                        {t.play.toGraveyard}
                    </button>
                    {battle && pos !== 'attack' && (
                        <button
                            type="button"
                            onClick={() => {
                                onUpdateCard?.(menu.card.instanceId, { position: 'attack' });
                                setMenu(null);
                            }}
                        >
                            {t.play.toAttack}
                        </button>
                    )}
                    {battle && pos !== 'defense' && (
                        <button
                            type="button"
                            onClick={() => {
                                onUpdateCard?.(menu.card.instanceId, { position: 'defense' });
                                setMenu(null);
                            }}
                        >
                            {t.play.toDefense}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            onUpdateCard?.(menu.card.instanceId, { faceDown: !menu.card.faceDown });
                            setMenu(null);
                        }}
                    >
                        {menu.card.faceDown ? t.play.reveal : t.play.cover}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onReturnToHand?.(menu.card.instanceId);
                            setMenu(null);
                        }}
                    >
                        {t.play.toHand}
                    </button>
                </CardActionMenu>
                );
            })()}
        </div>
    );
};

interface DigitalHandProps {
    board: PlayerBoard;
    gameType: string;
    onDraw: () => void;
    onDrawExtra: () => void;
    onShuffle: () => void;
    onToGraveyard: (instanceId: string) => void;
    draggingId: string | null;
    setDraggingId: (id: string | null) => void;
    onDropOnField: (instanceId: string, x: number, y: number, opts?: FieldPlayOpts) => void;
}

export const DigitalHand: React.FC<DigitalHandProps> = ({
    board,
    gameType,
    onDraw,
    onDrawExtra,
    onShuffle,
    onToGraveyard,
    draggingId,
    setDraggingId,
    onDropOnField,
}) => {
    const { t } = useLocale();
    const inspect = useInspectCard();
    const [menu, setMenu] = useState<CardMenu | null>(null);
    const battle = usesBattlePosition(gameType);

    const playCard = (card: BoardCard, opts: FieldPlayOpts) => {
        const slot = nextFieldSlot(board.field);
        onDropOnField(card.instanceId, slot.x, slot.y, opts);
        setMenu(null);
    };

    const handlePointerDown = (event: React.PointerEvent, card: BoardCard) => {
        event.preventDefault();
        const pointerId = event.pointerId;
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        let dragging = false;
        let ghost: HTMLElement | null = null;

        const move = (ev: PointerEvent) => {
            const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
            if (!dragging && dist < DRAG_THRESHOLD) return;
            if (!dragging) {
                dragging = true;
                setDraggingId(card.instanceId);
                setMenu(null);
                ghost = target.cloneNode(true) as HTMLElement;
                ghost.classList.add('digital-card-ghost');
                document.body.appendChild(ghost);
            }
            if (ghost) {
                ghost.style.left = `${ev.clientX}px`;
                ghost.style.top = `${ev.clientY}px`;
            }
        };
        const up = (ev: PointerEvent) => {
            ghost?.remove();
            target.releasePointerCapture(pointerId);
            target.removeEventListener('pointermove', move);
            target.removeEventListener('pointerup', up);
            setDraggingId(null);
            if (!dragging) {
                inspect(card);
                setMenu({ kind: 'hand', card, x: ev.clientX, y: ev.clientY });
                return;
            }
            const under = document.elementFromPoint(ev.clientX, ev.clientY);
            const fieldEl = under?.closest('[data-digital-field="self"]') as HTMLElement | null;
            const gy = under?.closest('[data-digital-gy]');
            if (gy) {
                onToGraveyard(card.instanceId);
                return;
            }
            if (fieldEl) {
                const box = fieldEl.getBoundingClientRect();
                onDropOnField(
                    card.instanceId,
                    Math.min(1, Math.max(0, (ev.clientX - box.left) / box.width)),
                    Math.min(1, Math.max(0, (ev.clientY - box.top) / box.height)),
                    { faceDown: false, position: 'attack' }
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

            {menu?.kind === 'hand' && (
                <CardActionMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
                    <button type="button" onClick={() => playCard(menu.card, { faceDown: false, position: 'attack' })}>
                        {t.play.faceUp}
                    </button>
                    <button type="button" onClick={() => playCard(menu.card, { faceDown: true, position: 'attack' })}>
                        {t.play.faceDown}
                    </button>
                    {battle && (
                        <button
                            type="button"
                            onClick={() => playCard(menu.card, { faceDown: true, position: 'defense' })}
                        >
                            {t.play.setDefense}
                        </button>
                    )}
                </CardActionMenu>
            )}
        </div>
    );
};
