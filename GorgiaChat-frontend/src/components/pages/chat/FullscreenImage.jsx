import React from 'react'

const FullscreenImage = ({
    style,
    fullscreenImage,
    closeFullscreenImage
}) => (
    <div
        className={style.fullscreenImageOverlay}
        onClick={closeFullscreenImage}
    >
        <div className={style.fullscreenImageContainer}>
            <img
                src={fullscreenImage}
                alt="Fullscreen"
                className={style.fullscreenImage}
                onClick={e => e.stopPropagation()}
            />
            <button
                className={style.fullscreenCloseBtn}
                onClick={closeFullscreenImage}
                style={{ background: 'none' }}
            >
                ✕
            </button>
        </div>
    </div>
)
export default FullscreenImage
