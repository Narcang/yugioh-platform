"use client";
import React from 'react';
import { useLayout } from '@/context/LayoutContext';
import { useLocale } from '@/context/LocaleContext';

const TableGuideModal: React.FC = () => {
    const { isTableGuideOpen, setIsTableGuideOpen } = useLayout();
    const { t } = useLocale();

    if (!isTableGuideOpen) return null;

    const items = [
        { title: t.play.guidePhaseTitle, body: t.play.guidePhase },
        { title: t.play.guidePassTitle, body: t.play.guidePass },
        { title: t.play.guideMicTitle, body: t.play.guideMic },
        { title: t.play.guideCamTitle, body: t.play.guideCam },
        { title: t.play.guideFullTitle, body: t.play.guideFull },
        { title: t.play.guideGridTitle, body: t.play.guideGrid },
        { title: t.play.guideBoxTitle, body: t.play.guideBox },
        { title: t.play.guideCardsTitle, body: t.play.guideCards },
        { title: t.play.guideInviteTitle, body: t.play.guideInvite },
        { title: t.play.guideSettingsTitle, body: t.play.guideSettings },
        { title: t.play.guideDiceTitle, body: t.play.guideDice },
        { title: t.play.tokens, body: t.play.guideTokens },
    ];

    return (
        <div className="modal-overlay" onClick={() => setIsTableGuideOpen(false)}>
            <div className="settings-modal table-guide-modal" onClick={(e) => e.stopPropagation()}>
                <div className="guide-header">
                    <h2 className="view-title">{t.play.guideTitle}</h2>
                    <p className="guide-lead">{t.play.guideLead}</p>
                </div>
                <ul className="guide-list">
                    {items.map((item) => (
                        <li key={item.title} className="guide-item">
                            <span className="guide-item-title">{item.title}</span>
                            <span className="guide-item-body">{item.body}</span>
                        </li>
                    ))}
                </ul>
                <div className="modal-footer-single-btn" style={{ padding: '0 20px 20px' }}>
                    <button className="primary-btn" onClick={() => setIsTableGuideOpen(false)}>
                        {t.play.guideClose}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TableGuideModal;
