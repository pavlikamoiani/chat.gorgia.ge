import React, { useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { useCall } from '../../contexts/CallContext';
import styles from '../../assets/css/CallModal.module.css';

const RejectionModal = () => {
    const { callState, dismissRejection } = useCall();

    if (!callState.callRejected) return null;

    return (
        <div className={styles.rejectionOverlay}>
            <div className={styles.rejectionContent}>
                <div className={styles.rejectionIcon}>
                    <MdClose size={32} color="#fff" />
                </div>
                <div className={styles.rejectionMessage}>
                    User is busy
                </div>
                <button
                    className={styles.dismissButton}
                    onClick={dismissRejection}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default RejectionModal;
