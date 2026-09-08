"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '@/context/LocaleContext';
import { useLayout } from '@/context/LayoutContext';
import type { BoardCard, BoardZone, OpenPile, PlayerBoard } from '@/lib/digitalBoard';
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
    const height = 340;
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

function ZoneViewer({
    pile,
    cards,
    readOnly,
    onClose,
    onRelocate,
    gameType = '',
}: {
    pile: OpenPile;
    cards: BoardCard[];
    readOnly?: boolean;
    onClose: () => void;
    onRelocate?: (instanceId: string, zone: BoardZone, opts?: FieldPlayOpts) => void;
    gameType?: string;
}) {
    const { t } = useLocale();
    const inspect = useInspectCard();
    const [menu, setMenu] = useState<{ card: BoardCard; x: number; y: number } | null>(null);
    const battle = usesBattlePosition(gameType);
    const title = pile === 'graveyard' ? t.play.graveyard : pile === 'extra' ? t.play.extra : t.play.exile;

    const move = (id: string, zone: BoardZone, opts?: FieldPlayOpts) => {
        onRelocate?.(id, zone, opts);
        setMenu(null);
    };

    return createPortal(
        <div className="digital-zone-overlay" onPointerDown={onClose}>
            <div
                className="digital-zone-panel"
                data-card-menu
                onPointerDown={(event) => event.stopPropagation()}
            >
                <div className="digital-zone-head">
                    <h3>
                        {title} <strong>{cards.length}</strong>
                    </h3>
                    <button type="button" className="digital-zone-close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>
                {cards.length === 0 ? (
                    <p className="digital-zone-empty">{t.play.emptyZone}</p>
                ) : (
                    <div className="digital-zone-grid">
                        {cards.map((card) => (
                            <button
                                key={card.instanceId}
                                type="button"
                                className="digital-zone-card"
                                onClick={(event) => {
                                    inspect(card);
                                    if (!readOnly && onRelocate) {
                                        setMenu({ card, x: event.clientX, y: event.clientY });
                                    }
                                }}
                                aria-label={card.name}
                            >
                                <img src={card.imageUrl} alt={card.name} draggable={false} onError={onCardImageError} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {menu && (
                <CardActionMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
                    <button type="button" onClick={() => move(menu.card.instanceId, 'hand')}>
                        {pile === 'extra' ? t.play.takeToHand : t.play.toHand}
                    </button>
                    {pile === 'extra' ? (
                        <>
                            <button
                                type="button"
                                onClick={() => move(menu.card.instanceId, 'field', { faceDown: false, position: 'attack' })}
                            >
                                {t.play.summon}
                            </button>
                            {battle && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        move(menu.card.instanceId, 'field', { faceDown: true, position: 'defense' })
                                    }
                                >
                                    {t.play.setDefense}
                                </button>
                            )}
                            <button type="button" onClick={() => move(menu.card.instanceId, 'graveyard')}>
                                {t.play.toGraveyard}
                            </button>
                            <button type="button" onClick={() => move(menu.card.instanceId, 'exile')}>
                                {t.play.toExile}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={() => move(menu.card.instanceId, 'field')}>
                                {t.play.toField}
                            </button>
                            <button type="button" onClick={() => move(menu.card.instanceId, 'library')}>
                                {t.play.toLibrary}
                            </button>
                            <button type="button" onClick={() => move(menu.card.instanceId, 'extra')}>
                                {t.play.toExtra}
                            </button>
                            {pile === 'graveyard' ? (
                                <button type="button" onClick={() => move(menu.card.instanceId, 'exile')}>
                                    {t.play.toExile}
                                </button>
                            ) : (
                                <button type="button" onClick={() => move(menu.card.instanceId, 'graveyard')}>
                                    {t.play.toGraveyard}
                                </button>
                            )}
                        </>
                    )}
                </CardActionMenu>
            )}
        </div>,
        document.body
    );
}

interface DigitalFieldProps {
    field: BoardCard[];
    dropId: string;
    readOnly?: boolean;
    gameType?: string;
    graveyard?: BoardCard[];
    exile?: BoardCard[];
    onMove?: (instanceId: string, x: number, y: number) => void;
    onReturnToHand?: (instanceId: string) => void;
    onToGraveyard?: (instanceId: string) => void;
    onToExile?: (instanceId: string) => void;
    onToExtra?: (instanceId: string) => void;
    onUpdateCard?: (instanceId: string, patch: FieldPlayOpts) => void;
}

export const DigitalField: React.FC<DigitalFieldProps> = ({
    field,
    dropId,
    readOnly,
    gameType = '',
    graveyard = [],
    exile = [],
    onMove,
    onReturnToHand,
    onToGraveyard,
    onToExile,
    onToExtra,
    onUpdateCard,
}) => {
    const { t } = useLocale();
    const inspect = useInspectCard();
    const fieldRef = useRef<HTMLDivElement>(null);
    const [menu, setMenu] = useState<CardMenu | null>(null);
    const [openPile, setOpenPile] = useState<OpenPile | null>(null);
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
                if (onToGraveyard && under?.closest('[data-digital-gy]')) {
                    onToGraveyard(card.instanceId);
                    return;
                }
                if (onToExile && under?.closest('[data-digital-exile]')) {
                    onToExile(card.instanceId);
                    return;
                }
                if (onToExtra && under?.closest('[data-digital-extra]')) {
                    onToExtra(card.instanceId);
                    return;
                }
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
            {readOnly && (
                <div className="digital-opp-piles">
                    <button type="button" onClick={() => setOpenPile('graveyard')}>
                        <span>{t.play.graveyard}</span>
                        <strong>{graveyard.length}</strong>
                    </button>
                    <button type="button" onClick={() => setOpenPile('exile')}>
                        <span>{t.play.exile}</span>
                        <strong>{exile.length}</strong>
                    </button>
                </div>
            )}

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
                    <button
                        type="button"
                        onClick={() => {
                            onToExile?.(menu.card.instanceId);
                            setMenu(null);
                        }}
                    >
                        {t.play.toExile}
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
                    <button
                        type="button"
                        onClick={() => {
                            onToExtra?.(menu.card.instanceId);
                            setMenu(null);
                        }}
                    >
                        {t.play.toExtra}
                    </button>
                </CardActionMenu>
                );
            })()}

            {openPile && (
                <ZoneViewer
                    pile={openPile}
                    cards={openPile === 'graveyard' ? graveyard : exile}
                    readOnly
                    onClose={() => setOpenPile(null)}
                />
            )}
        </div>
    );
};

interface DigitalHandProps {
    board: PlayerBoard;
    gameType: string;
    onDraw: () => void;
    onShuffle: () => void;
    onRelocate: (instanceId: string, zone: BoardZone, opts?: FieldPlayOpts) => void;
    draggingId: string | null;
    setDraggingId: (id: string | null) => void;
    onDropOnField: (instanceId: string, x: number, y: number, opts?: FieldPlayOpts) => void;
}

export const DigitalHand: React.FC<DigitalHandProps> = ({
    board,
    gameType,
    onDraw,
    onShuffle,
    onRelocate,
    draggingId,
    setDraggingId,
    onDropOnField,
}) => {
    const { t } = useLocale();
    const inspect = useInspectCard();
    const [menu, setMenu] = useState<CardMenu | null>(null);
    const [openPile, setOpenPile] = useState<OpenPile | null>(null);
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
            if (under?.closest('[data-digital-gy]')) {
                onRelocate(card.instanceId, 'graveyard');
                return;
            }
            if (under?.closest('[data-digital-exile]')) {
                onRelocate(card.instanceId, 'exile');
                return;
            }
            if (under?.closest('[data-digital-extra]')) {
                onRelocate(card.instanceId, 'extra');
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
                {(board.extra.length > 0 || gameType === 'Yugioh') && (
                    <button
                        type="button"
                        className="digital-pile"
                        data-digital-extra
                        onClick={() => setOpenPile('extra')}
                    >
                        <span>{t.play.extra}</span>
                        <strong>{board.extra.length}</strong>
                    </button>
                )}
                <button
                    type="button"
                    className="digital-pile"
                    data-digital-gy
                    onClick={() => setOpenPile('graveyard')}
                >
                    <span>{t.play.graveyard}</span>
                    <strong>{board.graveyard.length}</strong>
                </button>
                <button
                    type="button"
                    className="digital-pile"
                    data-digital-exile
                    onClick={() => setOpenPile('exile')}
                >
                    <span>{t.play.exile}</span>
                    <strong>{board.exile.length}</strong>
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
                    <button
                        type="button"
                        onClick={() => {
                            onRelocate(menu.card.instanceId, 'graveyard');
                            setMenu(null);
                        }}
                    >
                        {t.play.toGraveyard}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onRelocate(menu.card.instanceId, 'exile');
                            setMenu(null);
                        }}
                    >
                        {t.play.toExile}
                    </button>
                </CardActionMenu>
            )}

            {openPile && (
                <ZoneViewer
                    pile={openPile}
                    cards={board[openPile]}
                    onClose={() => setOpenPile(null)}
                    onRelocate={onRelocate}
                    gameType={gameType}
                />
            )}
        </div>
    );
};
