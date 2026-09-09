"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLayout } from '@/context/LayoutContext';
import { useLocale } from '@/context/LocaleContext';
import {
    resolveTokenDrop,
    tokenDef,
    tokensForGame,
    type TableToken,
    type TokenDef,
} from '@/lib/tokens';

const DRAG_THRESHOLD = 10;

function nameFor(kind: string, names: Record<string, string>): string {
    return names[kind] ?? kind;
}

export function TokenChip({
    def,
    count,
    title,
    armed,
    onPointerDown,
}: {
    def: TokenDef;
    count?: number;
    title: string;
    armed?: boolean;
    onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
    return (
        <button
            type="button"
            className={`token-chip${armed ? ' is-armed' : ''}`}
            style={{ background: def.hue }}
            title={title}
            onPointerDown={onPointerDown}
        >
            <span className="token-chip-mark">{def.mark}</span>
            {def.stackable && (count ?? 0) > 1 && <span className="token-chip-count">{count}</span>}
        </button>
    );
}

function spawnGhost(def: TokenDef, clientX: number, clientY: number): HTMLDivElement {
    const ghost = document.createElement('div');
    ghost.className = 'token-ghost';
    ghost.style.background = def.hue;
    ghost.style.left = `${clientX}px`;
    ghost.style.top = `${clientY}px`;
    ghost.textContent = def.mark;
    document.body.appendChild(ghost);
    return ghost;
}

export function TokenPalette({
    onPlace,
}: {
    onPlace: (kind: string, drop: NonNullable<ReturnType<typeof resolveTokenDrop>>) => void;
}) {
    const { isTokenPaletteOpen, gameType } = useLayout();
    const { t } = useLocale();
    const [armed, setArmed] = useState<string | null>(null);
    const defs = tokensForGame(gameType);

    useEffect(() => {
        if (!isTokenPaletteOpen) setArmed(null);
    }, [isTokenPaletteOpen]);

    useEffect(() => {
        if (!armed || !isTokenPaletteOpen) return;
        const up = (event: PointerEvent) => {
            if ((event.target as HTMLElement | null)?.closest('.token-palette, .sidebar, .token-chip, [data-token-menu]')) return;
            const drop = resolveTokenDrop(event.clientX, event.clientY);
            if (drop) onPlace(armed, drop);
        };
        window.addEventListener('pointerup', up);
        return () => window.removeEventListener('pointerup', up);
    }, [armed, isTokenPaletteOpen, onPlace]);

    const handleChipDown = (event: React.PointerEvent<HTMLButtonElement>, def: TokenDef) => {
        event.preventDefault();
        event.stopPropagation();
        const pointerId = event.pointerId;
        const target = event.currentTarget;
        target.setPointerCapture(pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        let dragging = false;
        let ghost: HTMLDivElement | null = null;

        const move = (ev: PointerEvent) => {
            const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
            if (!dragging && dist < DRAG_THRESHOLD) return;
            dragging = true;
            setArmed(null);
            if (!ghost) ghost = spawnGhost(def, ev.clientX, ev.clientY);
            ghost.style.left = `${ev.clientX}px`;
            ghost.style.top = `${ev.clientY}px`;
        };
        const up = (ev: PointerEvent) => {
            target.releasePointerCapture(pointerId);
            target.removeEventListener('pointermove', move);
            target.removeEventListener('pointerup', up);
            ghost?.remove();
            if (dragging) {
                const drop = resolveTokenDrop(ev.clientX, ev.clientY);
                if (drop) onPlace(def.kind, drop);
                return;
            }
            setArmed((prev) => (prev === def.kind ? null : def.kind));
        };
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerup', up);
    };

    if (!isTokenPaletteOpen) return null;

    return createPortal(
        <div className="token-palette" data-token-palette>
            <p className="token-palette-title">{t.play.tokens}</p>
            <p className="token-palette-hint">{armed ? t.play.tokensArmed : t.play.tokensHint}</p>
            <div className="token-palette-grid">
                {defs.map((def) => (
                    <div key={def.kind} className="token-palette-item">
                        <TokenChip
                            def={def}
                            title={nameFor(def.kind, t.play.tokenName)}
                            armed={armed === def.kind}
                            onPointerDown={(event) => handleChipDown(event, def)}
                        />
                        <span>{nameFor(def.kind, t.play.tokenName)}</span>
                    </div>
                ))}
            </div>
        </div>,
        document.body
    );
}

type TokenMenu = { token: TableToken; x: number; y: number };

export function TokenOverlay({
    tokens,
    gameType,
    readOnly,
    onMove,
    onChange,
}: {
    tokens: TableToken[];
    gameType: string;
    readOnly?: boolean;
    onMove?: (id: string, drop: NonNullable<ReturnType<typeof resolveTokenDrop>>) => void;
    onChange?: (id: string, patch: { count?: number } | 'remove') => void;
}) {
    const { t } = useLocale();
    const [menu, setMenu] = useState<TokenMenu | null>(null);
    const floating = tokens.filter((item) => !item.attachedTo);

    const handleDown = (event: React.PointerEvent<HTMLButtonElement>, token: TableToken) => {
        event.preventDefault();
        event.stopPropagation();
        if (readOnly || !onMove) return;
        const pointerId = event.pointerId;
        const target = event.currentTarget;
        target.setPointerCapture(pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        let dragging = false;
        const def = tokenDef(token.kind, gameType);
        let ghost: HTMLDivElement | null = null;

        const move = (ev: PointerEvent) => {
            const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
            if (!dragging && dist < DRAG_THRESHOLD) return;
            dragging = true;
            setMenu(null);
            if (!ghost) ghost = spawnGhost(def, ev.clientX, ev.clientY);
            ghost.style.left = `${ev.clientX}px`;
            ghost.style.top = `${ev.clientY}px`;
        };
        const up = (ev: PointerEvent) => {
            target.releasePointerCapture(pointerId);
            target.removeEventListener('pointermove', move);
            target.removeEventListener('pointerup', up);
            ghost?.remove();
            if (dragging) {
                const drop = resolveTokenDrop(ev.clientX, ev.clientY);
                if (drop) onMove(token.id, drop);
                else onChange?.(token.id, 'remove');
                return;
            }
            setMenu({ token, x: ev.clientX, y: ev.clientY });
        };
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerup', up);
    };

    return (
        <>
            <div className="token-overlay" aria-hidden={floating.length === 0}>
                {floating.map((token) => {
                    const def = tokenDef(token.kind, gameType);
                    return (
                        <div
                            key={token.id}
                            className="token-overlay-item"
                            style={{ left: `${token.x * 100}%`, top: `${token.y * 100}%` }}
                        >
                            <TokenChip
                                def={def}
                                count={token.count}
                                title={nameFor(token.kind, t.play.tokenName)}
                                onPointerDown={(event) => handleDown(event, token)}
                            />
                        </div>
                    );
                })}
            </div>
            {menu && onChange && (
                <TokenActionMenu
                    x={menu.x}
                    y={menu.y}
                    stackable={tokenDef(menu.token.kind, gameType).stackable}
                    count={menu.token.count}
                    onClose={() => setMenu(null)}
                    onInc={() => {
                        onChange(menu.token.id, { count: menu.token.count + 1 });
                        setMenu(null);
                    }}
                    onDec={() => {
                        if (menu.token.count <= 1) onChange(menu.token.id, 'remove');
                        else onChange(menu.token.id, { count: menu.token.count - 1 });
                        setMenu(null);
                    }}
                    onRemove={() => {
                        onChange(menu.token.id, 'remove');
                        setMenu(null);
                    }}
                />
            )}
        </>
    );
}

export function CardTokens({
    tokens,
    gameType,
    readOnly,
    onMove,
    onChange,
}: {
    tokens: TableToken[];
    gameType: string;
    readOnly?: boolean;
    onMove?: (id: string, drop: NonNullable<ReturnType<typeof resolveTokenDrop>>) => void;
    onChange?: (id: string, patch: { count?: number } | 'remove') => void;
}) {
    const { t } = useLocale();
    const [menu, setMenu] = useState<TokenMenu | null>(null);
    if (tokens.length === 0) return null;

    const handleDown = (event: React.PointerEvent<HTMLButtonElement>, token: TableToken) => {
        event.preventDefault();
        event.stopPropagation();
        if (readOnly || !onMove) {
            return;
        }
        const pointerId = event.pointerId;
        const target = event.currentTarget;
        target.setPointerCapture(pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        let dragging = false;
        const def = tokenDef(token.kind, gameType);
        let ghost: HTMLDivElement | null = null;

        const move = (ev: PointerEvent) => {
            const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
            if (!dragging && dist < DRAG_THRESHOLD) return;
            dragging = true;
            setMenu(null);
            if (!ghost) ghost = spawnGhost(def, ev.clientX, ev.clientY);
            ghost.style.left = `${ev.clientX}px`;
            ghost.style.top = `${ev.clientY}px`;
        };
        const up = (ev: PointerEvent) => {
            target.releasePointerCapture(pointerId);
            target.removeEventListener('pointermove', move);
            target.removeEventListener('pointerup', up);
            ghost?.remove();
            if (dragging) {
                const drop = resolveTokenDrop(ev.clientX, ev.clientY);
                if (drop) onMove(token.id, drop);
                else onChange?.(token.id, 'remove');
                return;
            }
            setMenu({ token, x: ev.clientX, y: ev.clientY });
        };
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerup', up);
    };

    return (
        <>
            <span className="card-tokens">
                {tokens.map((token) => {
                    const def = tokenDef(token.kind, gameType);
                    return (
                        <TokenChip
                            key={token.id}
                            def={def}
                            count={token.count}
                            title={nameFor(token.kind, t.play.tokenName)}
                            onPointerDown={(event) => handleDown(event, token)}
                        />
                    );
                })}
            </span>
            {menu && onChange && (
                <TokenActionMenu
                    x={menu.x}
                    y={menu.y}
                    stackable={tokenDef(menu.token.kind, gameType).stackable}
                    count={menu.token.count}
                    onClose={() => setMenu(null)}
                    onInc={() => {
                        onChange(menu.token.id, { count: menu.token.count + 1 });
                        setMenu(null);
                    }}
                    onDec={() => {
                        if (menu.token.count <= 1) onChange(menu.token.id, 'remove');
                        else onChange(menu.token.id, { count: menu.token.count - 1 });
                        setMenu(null);
                    }}
                    onRemove={() => {
                        onChange(menu.token.id, 'remove');
                        setMenu(null);
                    }}
                />
            )}
        </>
    );
}

function TokenActionMenu({
    x,
    y,
    stackable,
    count,
    onClose,
    onInc,
    onDec,
    onRemove,
}: {
    x: number;
    y: number;
    stackable: boolean;
    count: number;
    onClose: () => void;
    onInc: () => void;
    onDec: () => void;
    onRemove: () => void;
}) {
    const { t } = useLocale();
    useEffect(() => {
        const close = (event: PointerEvent) => {
            if ((event.target as HTMLElement | null)?.closest('[data-token-menu]')) return;
            onClose();
        };
        window.addEventListener('pointerdown', close);
        return () => window.removeEventListener('pointerdown', close);
    }, [onClose]);

    const left = Math.min(Math.max(8, x), window.innerWidth - 180);
    const top = Math.min(Math.max(8, y), window.innerHeight - 160);

    return createPortal(
        <div
            className="digital-card-menu token-action-menu"
            data-token-menu
            style={{ left, top }}
            onPointerDown={(event) => event.stopPropagation()}
        >
            {stackable && (
                <button type="button" onClick={onInc}>
                    {t.play.tokenInc}
                </button>
            )}
            {stackable && count > 0 && (
                <button type="button" onClick={onDec}>
                    {t.play.tokenDec}
                </button>
            )}
            <button type="button" onClick={onRemove}>
                {t.play.tokenRemove}
            </button>
        </div>,
        document.body
    );
}
