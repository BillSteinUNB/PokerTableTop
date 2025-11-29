import React from 'react';
import soundManager from '../../services/soundManager';
import './SoundButton.css';

/**
 * Button wrapper that plays click sound
 * Use this instead of regular <button> for audio feedback
 */
const SoundButton = ({
    children,
    onClick,
    className = '',
    disabled = false,
    playSound = true,
    ...props
}) => {
    const handleClick = (e) => {
        if (playSound && !disabled) {
            soundManager.play('button-click');
        }
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <button
            className={className}
            onClick={handleClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default SoundButton;
