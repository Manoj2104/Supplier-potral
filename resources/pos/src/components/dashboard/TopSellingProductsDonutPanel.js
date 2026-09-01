import React, { useEffect } from "react";
import { Card } from "react-bootstrap";
import { connect } from "react-redux";
import moment from "moment";
import { yearlyTopProduct } from "../../store/action/yearlyTopProductAction";
import TopSellingProductChart from "./TopSellingProductChart";

const TopSellingProductsDonutPanel = (props) => {
    const {
        frontSetting,
        yearTopProduct,
        yearlyTopProduct,
        allConfigData,
        allSalePurchase,
    } = props;

    const year = new Date();

    useEffect(() => {
        yearlyTopProduct();
    }, []);

    return (
        <Card className="dashboard-panel mb-0">
            <Card.Header>
                <h5 className="mb-0">Top Selling Products ({moment(year).format("YYYY")})</h5>
                <button className="dashboard-view-button">View All</button>
            </Card.Header>
            <Card.Body style={{ minHeight: '300px', display: 'flex', alignItems: 'center' }}>
                <div className="w-100">
                    <TopSellingProductChart 
                        yearTopProduct={yearTopProduct} 
                        frontSetting={frontSetting}
                        allSalePurchase={allSalePurchase}
                        allConfigData={allConfigData}
                    />
                </div>
            </Card.Body>
        </Card>
    );
};

const mapStateToProps = (state) => {
    const { yearTopProduct, allConfigData, allSalePurchase } = state;
    return { yearTopProduct, allConfigData, allSalePurchase };
};

export default connect(mapStateToProps, { yearlyTopProduct })(TopSellingProductsDonutPanel);
