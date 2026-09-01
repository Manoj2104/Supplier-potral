import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import DashboardSkeleton from './DashboardSkeleton';
import TodaySalePurchaseCount from './TodaySalePurchaseCount';
import RecentSale from './RecentSale';
import TopSellingProduct from './TopSellingProduct';
import TopCustomersChart from './TopCustomersChart';
import SalesOverviewPanel from './SalesOverviewPanel';
import RecentActivitiesPanel from './RecentActivitiesPanel';
import QuickStatsPanel from './QuickStatsPanel';
import StockAlert from "./StockAlert";
import SalesByCategoryPanel from "./SalesByCategoryPanel";
import { placeholderText } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Row, Col } from "react-bootstrap";
import { isFirstDashboardLoad, markDashboardAnimated } from "./dashboardAnimationState";
import "./DashboardPremium.css";

const Dashboard = () => {
    const { frontSetting } = useSelector(state => state);

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText('dashboard.title')} />
            <div className="dashboard-page premium-workspace">
                    <div className="dashboard-intro">
                        <div>
                            <h1 className="dashboard-title">Dashboard</h1>
                            <p className="dashboard-subtitle">Welcome back! Here's what's happening with your store today.</p>
                        </div>
                        <div className="dashboard-actions">
                            <Link to="/app/products/create" className="dashboard-add-button">
                                <FontAwesomeIcon icon={faPlus} /> Add Product
                            </Link>
                            <Link to="/app/products" className="dashboard-import-button">
                                <FontAwesomeIcon icon={faCloudArrowUp} /> Import Data
                            </Link>
                        </div>
                    </div>

                    <TodaySalePurchaseCount frontSetting={frontSetting} />

                    <div className="mb-4">
                        <QuickStatsPanel frontSetting={frontSetting} />
                    </div>

                    <Row className="g-4 mb-4 align-items-stretch">
                        <Col xl={4} lg={4} md={12} className="col-12">
                            <SalesOverviewPanel frontSetting={frontSetting} />
                        </Col>
                        <Col xl={4} lg={4} md={12} className="col-12">
                            <TopSellingProduct frontSetting={frontSetting} />
                        </Col>
                        <Col xl={4} lg={4} md={12} className="col-12">
                            <RecentActivitiesPanel frontSetting={frontSetting} />
                        </Col>
                    </Row>

                    <Row className="g-4 mb-4">
                        <Col col={12} className="col-12">
                            <RecentSale frontSetting={frontSetting} />
                        </Col>
                    </Row>

                    <Row className="g-4 mb-4 align-items-stretch">
                        <Col xl={4} lg={4} md={12} className="col-12">
                            <StockAlert frontSetting={frontSetting} />
                        </Col>
                        <Col xl={4} lg={4} md={12} className="col-12">
                            <SalesByCategoryPanel frontSetting={frontSetting} />
                        </Col>
                        <Col xl={4} lg={4} md={12} className="col-12">
                            <TopCustomersChart frontSetting={frontSetting} />
                        </Col>
                    </Row>
                </div>
        </MasterLayout>
    );
};

export default Dashboard;
