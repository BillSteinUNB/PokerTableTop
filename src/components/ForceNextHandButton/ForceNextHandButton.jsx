import React from 'react';
import './ForceNextHandButton.css';

/**
 * Force Next Hand Button Component (Debug Tool)
 * Only visible to host - forces all remaining players to fold and advances to next hand
 */
function ForceNextHandButton({ onClick }) {
    return (
        <button className="force-next-hand-button" onClick={onClick} title="Force Next Hand (Debug)">
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* Fast forward icon */}
                <polygon points="5 4 15 12 5 20 5 4" />
                <polygon points="15 4 25 12 15 20 15 4" />
            </svg>
            <span>Skip Hand</span>
        </button>
    );
}

export default ForceNextHandButton;
