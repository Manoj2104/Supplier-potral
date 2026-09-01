import React from 'react';
import PropTypes from 'prop-types';
import { toastType } from '../../constants/index';
import { faCheck, faClose, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { placeholderText } from "../sharedMethod";

const ToastCard = (props) => {
    const { type, text, closeToast } = props;
    const isError = type === toastType.ERROR;

    return (
        <div className="toast-card d-flex align-items-center justify-content-between w-100 position-relative py-1">
            <div className="d-flex align-items-center gap-2.5 pe-2">
                <div
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: isError ? "#FEE2E2" : "#DCFCE7",
                        color: isError ? "#DC2626" : "#16A34A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 12,
                    }}
                >
                    <FontAwesomeIcon icon={isError ? faXmark : faCheck} />
                </div>
                <div>
                    <div className="fw-bold" style={{ fontSize: 13, color: "#0F172A", lineHeight: 1.2 }}>
                        {isError ? "Error" : "Success"}
                    </div>
                    <div className="text-truncate" style={{ fontSize: 12, color: "#475569", lineHeight: 1.3, maxWidth: 260 }}>
                        {text}
                    </div>
                </div>
            </div>

            <FontAwesomeIcon
                icon={faClose}
                className="cursor-pointer text-muted"
                style={{ fontSize: 12, opacity: 0.6, transition: "opacity 0.15s ease" }}
                onClick={closeToast}
            />
        </div>
    );
};

ToastCard.propTypes = {
    text: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),
    type: PropTypes.string,
    closeToast: PropTypes.func,
};

export default ToastCard;
