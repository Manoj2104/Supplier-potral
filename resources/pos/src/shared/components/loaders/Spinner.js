import React from "react";

const Spinner = () => {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 custom-loading">
            <div className="spinner-border text-success" role="status" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "3px", color: "#10B981" }}>
                <span className="visually-hidden">Loading...</span>
            </div>
            <span className="mt-3 text-muted fw-semibold" style={{ fontSize: "13px", letterSpacing: "0.3px" }}>
                Loading...
            </span>
        </div>
    );
};

export default Spinner;
