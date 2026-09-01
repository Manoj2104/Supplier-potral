import { faList, faExpand, faCompress, faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Nav } from 'react-bootstrap-v5';
import PosCalculator from './PosCalculator';
import Dropdown from 'react-bootstrap/Dropdown';
import { getFormattedMessage } from '../../../shared/sharedMethod';
import PosRegisterOpenAlertModel from '../../../components/posRegister/PosRegisterOpenAlertModel';
import ReprintInvoiceModal from '../reprintModal/ReprintInvoiceModal';
import RegisterDropdown from './RegisterDropdown';

const HeaderAllButton = ( props ) => {
    const { setOpneCalculator, opneCalculator, goToDetailScreen, goToHoldScreen, holdListData, handleClickCloseRegister, frontSetting, allConfigData } = props;
    const [ isFullscreen, setIsFullscreen ] = useState( false );
    const [ showROAlertModel, setShowROAlertModel ] = useState( false );
    const [ showReprintModal, setShowReprintModal ] = useState( false );

    const fullScreen = () => {
        if ( !document.fullscreenElement ) {
            document.documentElement.requestFullscreen().catch(err => console.log(err));
            setIsFullscreen( true );
        } else {
            if ( document.exitFullscreen ) {
                document.exitFullscreen().catch(err => console.log(err));
                setIsFullscreen( false );
            }
        }
    };

    const opneCalculatorModel = () => {
        if ( opneCalculator ) {
            setOpneCalculator( false );
        } else {
            setOpneCalculator( true );
        }
    };

    return (
        <>
            <Nav className='align-items-center header-btn-grp justify-content-end flex-nowrap gap-1'>
                {/* Barcode */}
                <button
                    type="button"
                    className="btn btn-sm btn-light border-0 d-flex flex-column align-items-center px-2 py-1"
                    style={{ fontSize: "10px", color: "#475569" }}
                    onClick={() => {
                        const searchEl = document.querySelector(".pos-top-search-input") || document.querySelector("input[type='text']");
                        if (searchEl) searchEl.focus();
                    }}
                >
                    <i className="bi bi-barcode fs-5" />
                    <span>Barcode</span>
                </button>

                {/* QR Scan */}
                <button
                    type="button"
                    className="btn btn-sm btn-light border-0 d-flex flex-column align-items-center px-2 py-1"
                    style={{ fontSize: "10px", color: "#475569" }}
                    onClick={() => {
                        const searchEl = document.querySelector(".pos-top-search-input") || document.querySelector("input[type='text']");
                        if (searchEl) searchEl.focus();
                    }}
                >
                    <i className="bi bi-qr-code-scan fs-5" />
                    <span>QR Scan</span>
                </button>

                {/* Calculator */}
                <button
                    type="button"
                    className="btn btn-sm btn-light border-0 d-flex flex-column align-items-center px-2 py-1"
                    style={{ fontSize: "10px", color: "#475569" }}
                    onClick={opneCalculatorModel}
                >
                    <i className="bi bi-calculator fs-5" />
                    <span>Calculator</span>
                </button>

                {/* Active Billing Tab */}
                <button
                    type="button"
                    className="btn btn-sm btn-success d-flex flex-column align-items-center px-3 py-1 fw-bold text-white shadow-sm ms-1"
                    style={{ fontSize: "10px", borderRadius: "10px", background: "#16A34A", border: "none" }}
                    onClick={() => window.location.reload()}
                >
                    <i className="bi bi-receipt fs-5" />
                    <span>Billing</span>
                </button>

                {/* Dashboard */}
                <a
                    href="#/app/dashboard"
                    className="btn btn-sm btn-light border-0 d-flex flex-column align-items-center px-2 py-1 text-decoration-none"
                    style={{ fontSize: "10px", color: "#475569" }}
                >
                    <i className="bi bi-speedometer2 fs-5" />
                    <span>Dashboard</span>
                </a>

                {/* Reports */}
                <a
                    href="#/app/reports/sales"
                    className="btn btn-sm btn-light border-0 d-flex flex-column align-items-center px-2 py-1 text-decoration-none"
                    style={{ fontSize: "10px", color: "#475569" }}
                >
                    <i className="bi bi-file-earmark-bar-graph fs-5" />
                    <span>Reports</span>
                </a>

                {/* Settings */}
                <a
                    href="#/app/settings"
                    className="btn btn-sm btn-light border-0 d-flex flex-column align-items-center px-2 py-1 text-decoration-none"
                    style={{ fontSize: "10px", color: "#475569" }}
                >
                    <i className="bi bi-gear fs-5" />
                    <span>Settings</span>
                </a>

                {/* Fullscreen Button */}
                <button
                    type="button"
                    className="btn btn-sm btn-light border-0 d-flex flex-column align-items-center px-2 py-1"
                    style={{ fontSize: "10px", color: "#475569" }}
                    onClick={fullScreen}
                    title="Toggle Fullscreen"
                >
                    <i className={isFullscreen ? "bi bi-fullscreen-exit fs-5" : "bi bi-arrows-fullscreen fs-5"} />
                    <span>Fullscreen</span>
                </button>

                {/* Reprint Invoice Button */}
                <button
                    type="button"
                    className="btn btn-sm btn-light border-0 d-flex flex-column align-items-center px-2 py-1"
                    style={{ fontSize: "10px", color: "#475569" }}
                    onClick={() => setShowReprintModal(true)}
                    title="Reprint Sales Invoice / Receipt"
                >
                    <i className="bi bi-printer fs-5 text-success" />
                    <span>Reprint</span>
                </button>

                {/* Notifications Bell */}
                <div className="position-relative ms-1">
                    <i className="bi bi-bell fs-4 text-gray-700 cursor-pointer" />
                    <span className="badge bg-success position-absolute top-0 end-0 rounded-circle" style={{ fontSize: "8px", padding: "2px 4px" }}>3</span>
                </div>
            </Nav>

            {opneCalculator && <PosCalculator opneCalculatorModel={opneCalculatorModel} />}
            <PosRegisterOpenAlertModel showROAlertModel={showROAlertModel} setShowROAlertModel={setShowROAlertModel} />

            {/* Reprint Invoice Modal */}
            <ReprintInvoiceModal 
                show={showReprintModal} 
                handleClose={() => setShowReprintModal(false)}
                frontSetting={frontSetting}
                allConfigData={allConfigData}
            />
        </>
    );
};

export default HeaderAllButton;
