"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Room {
  id: string;
  host_name: string;
  host_id: string;
  format: string;
  language: string;
  current_players: number;
  max_players: number;
  is_public: boolean;
  created_at: string;
  settings?: { gameType?: string };
}

interface UserRow {
  id: string;
  username: string | null;
  full_name: string | null;
  is_admin: boolean;
  is_banned: boolean;
  updated_at: string;
}

type Tab = 'rooms' | 'users';

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('rooms');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const token = session?.access_token ?? '';

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    return fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts?.headers ?? {}),
      },
    });
  }, [token]);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/admin?action=rooms');
    const json = await res.json();
    setRooms(json.rooms ?? []);
    setLoading(false);
  }, [apiFetch]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/admin?action=users');
    const json = await res.json();
    setUsers(json.users ?? []);
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    if (!isOpen) return;
    if (tab === 'rooms') loadRooms();
    else loadUsers();
  }, [isOpen, tab, loadRooms, loadUsers]);

  const action = async (act: string, targetId: string, label: string) => {
    if (!confirm(`Confermi: ${label}?`)) return;
    setActionLoading(targetId + act);
    const res = await apiFetch('/api/admin', {
      method: 'POST',
      body: JSON.stringify({ action: act, targetId }),
    });
    const json = await res.json();
    setActionLoading(null);
    if (json.ok) {
      setMessage({ type: 'ok', text: `${label} — completato` });
      if (tab === 'rooms') loadRooms(); else loadUsers();
    } else {
      setMessage({ type: 'err', text: json.error ?? 'Errore' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (!isOpen) return null;

  const tabStyle = (t: Tab): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    color: tab === t ? '#F4C430' : '#888',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: tab === t ? 700 : 400,
    borderBottom: tab === t ? '2px solid #F4C430' : '2px solid transparent',
  });

  const btnStyle = (color: string, disabled = false): React.CSSProperties => ({
    background: disabled ? '#374151' : 'transparent',
    border: `1px solid ${disabled ? '#374151' : color}`,
    color: disabled ? '#6B7280' : color,
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="create-room-modal"
        style={{ maxWidth: '800px', width: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛡️</span> Pannello Admin
          </h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Message banner */}
        {message && (
          <div style={{
            padding: '8px 16px',
            background: message.type === 'ok' ? '#064e3b' : '#7f1d1d',
            color: message.type === 'ok' ? '#6ee7b7' : '#fca5a5',
            fontSize: '13px',
            flexShrink: 0,
          }}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #333', flexShrink: 0 }}>
          <button style={tabStyle('rooms')} onClick={() => setTab('rooms')}>
            🎮 Lobby attive ({rooms.length})
          </button>
          <button style={tabStyle('users')} onClick={() => setTab('users')}>
            👤 Giocatori ({users.length})
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Caricamento...</div>
          ) : tab === 'rooms' ? (
            /* ---- ROOMS ---- */
            rooms.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6B7280', padding: '40px' }}>Nessuna lobby attiva</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: '#9CA3AF', borderBottom: '1px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Host</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Gioco</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Formato</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Giocatori</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Tipo</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Azione</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{r.host_name}</td>
                      <td style={{ padding: '8px', color: '#F4C430' }}>{r.settings?.gameType ?? '—'}</td>
                      <td style={{ padding: '8px', color: '#9CA3AF' }}>{r.format}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ color: r.current_players >= r.max_players ? '#EF4444' : '#10B981' }}>
                          {r.current_players}/{r.max_players}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#9CA3AF' }}>
                        {r.is_public ? '🔓 Pubblica' : '🔒 Privata'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button
                          style={btnStyle('#EF4444', actionLoading === r.id + 'close_room')}
                          disabled={actionLoading === r.id + 'close_room'}
                          onClick={() => action('close_room', r.id, `Chiudi lobby di ${r.host_name}`)}
                        >
                          {actionLoading === r.id + 'close_room' ? '...' : '✕ Chiudi'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            /* ---- USERS ---- */
            users.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6B7280', padding: '40px' }}>Nessun utente trovato</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: '#9CA3AF', borderBottom: '1px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Username</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Nome</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Ruolo</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Stato</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1f2937', opacity: u.is_banned ? 0.6 : 1 }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>
                        {u.username ?? <span style={{ color: '#6B7280' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px', color: '#9CA3AF' }}>{u.full_name ?? '—'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {u.is_admin ? (
                          <span style={{ color: '#F4C430', fontWeight: 700 }}>🛡️ Admin</span>
                        ) : (
                          <span style={{ color: '#6B7280' }}>Giocatore</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {u.is_banned ? (
                          <span style={{ color: '#EF4444' }}>🚫 Bannato</span>
                        ) : (
                          <span style={{ color: '#10B981' }}>✓ Attivo</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {/* Ban / Unban */}
                          {u.is_banned ? (
                            <button
                              style={btnStyle('#10B981', !!actionLoading)}
                              disabled={!!actionLoading}
                              onClick={() => action('unban_user', u.id, `Sbanna ${u.username}`)}
                            >
                              Sbanna
                            </button>
                          ) : (
                            <button
                              style={btnStyle('#EF4444', !!actionLoading)}
                              disabled={!!actionLoading}
                              onClick={() => action('ban_user', u.id, `Banna ${u.username}`)}
                            >
                              Banna
                            </button>
                          )}

                          {/* Admin toggle */}
                          {u.is_admin ? (
                            <button
                              style={btnStyle('#9CA3AF', !!actionLoading)}
                              disabled={!!actionLoading}
                              onClick={() => action('remove_admin', u.id, `Rimuovi admin da ${u.username}`)}
                            >
                              - Admin
                            </button>
                          ) : (
                            <button
                              style={btnStyle('#F4C430', !!actionLoading)}
                              disabled={!!actionLoading}
                              onClick={() => action('make_admin', u.id, `Rendi admin ${u.username}`)}
                            >
                              + Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #333', flexShrink: 0, textAlign: 'right' }}>
          <button className="btn-secondary" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
