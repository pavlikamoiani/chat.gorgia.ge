/**
 * Check if the browser supports getUserMedia API
 * @returns {boolean} True if supported, false otherwise
 */
export const isMediaDevicesSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Request camera and/or microphone permissions
 * @param {boolean} video Whether to request video permission
 * @param {boolean} audio Whether to request audio permission
 * @returns {Promise<MediaStream>} Media stream if successful
 */
export const checkMediaPermissions = async (video = true, audio = true) => {
    if (!isMediaDevicesSupported()) {
        throw new Error("Your browser doesn't support media devices");
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: video ? { width: 640, height: 480 } : false,
            audio
        });
        return stream;
    } catch (err) {
        console.error("Media permission error:", err);

        if (err.name === "NotAllowedError") {
            throw new Error("Media access denied. Please grant permission for camera/microphone.");
        } else if (err.name === "NotFoundError") {
            throw new Error("No camera or microphone found. Please connect a device and try again.");
        } else {
            throw new Error(`Media error: ${err.message || err.name}`);
        }
    }
};

/**
 * Stop all tracks in a media stream
 * @param {MediaStream} stream The media stream to stop
 */
export const stopMediaStream = (stream) => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
};
