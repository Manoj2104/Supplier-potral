import React, { useCallback, useEffect } from 'react';
import { getFormattedMessage } from '../sharedMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import './DeleteModelPremium.css';

const DeleteModel = (props) => {
    const { onClickDeleteModel, deleteUserClick, name, title } = props;

    const escFunction = useCallback((event) => {
        if (event.keyCode === 27) {
            onClickDeleteModel(false);
        }
    }, [onClickDeleteModel]);

    useEffect(() => {
        document.addEventListener('keydown', escFunction, false);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', escFunction, false);
            document.body.style.overflow = 'unset';
        };
    }, [escFunction]);

    return (
        <div className="prem-delete-backdrop" onClick={() => onClickDeleteModel(false)}>
            <div className="prem-delete-modal-wrap" onClick={(e) => e.stopPropagation()}>
                {/* Top Close Button */}
                <button type="button" className="prem-delete-close-btn" onClick={() => onClickDeleteModel(false)}>
                    <FontAwesomeIcon icon={faXmark} />
                </button>

                {/* Animated Pulsing Icon Header */}
                <div className="prem-delete-icon-outer">
                    <div className="prem-delete-icon-pulse"></div>
                    <div className="prem-delete-icon-inner">
                        <FontAwesomeIcon icon={faTrashCan} />
                    </div>
                </div>

                {/* Content Header */}
                <h2 className="prem-delete-title">{title || getFormattedMessage('delete-modal.title')}</h2>

                {/* Body Message with Highlighted Item Name */}
                <p className="prem-delete-desc">
                    Are you sure you want to delete <span className="prem-delete-item-pill">{name}</span>?
                </p>
                <div className="prem-delete-warning-box">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="prem-delete-warn-icon" />
                    <span>This operation is permanent and cannot be undone.</span>
                </div>

                {/* Action Buttons */}
                <div className="prem-delete-actions">
                    <button
                        type="button"
                        className="prem-delete-btn-cancel"
                        onClick={() => onClickDeleteModel(false)}
                    >
                        {getFormattedMessage('delete-modal.no-btn') || "Cancel"}
                    </button>
                    <button
                        type="button"
                        className="prem-delete-btn-confirm"
                        onClick={() => {
                            deleteUserClick();
                        }}
                    >
                        <FontAwesomeIcon icon={faTrashCan} />
                        <span>{getFormattedMessage('delete-modal.yes-btn') || "Yes, Delete"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModel;
