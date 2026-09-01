import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Card, Row, Col } from "react-bootstrap";
import {
    getFormattedMessage,
    placeholderText,
    currencySymbolHandling,
} from "../../shared/sharedMethod";
import { connect } from "react-redux";
import { weekSalePurchases } from "../../store/action/weeksalePurchaseAction";
import { yearlyTopProduct } from "../../store/action/yearlyTopProductAction";
import moment from "moment";
import TopSellingProductChart from "./TopSellingProductChart";

const ThisWeekSalePurchaseChart = (props) => {
    const {
        frontSetting,
        weekSalePurchases,
        weekSalePurchase,
        yearTopProduct,
        yearlyTopProduct,
        allConfigData,
        allSalePurchase,
    } = props;

    const year = new Date();

    useEffect(() => {
        weekSalePurchases();
        yearlyTopProduct();
    }, []);

    const currency = frontSetting
        ? frontSetting.value && frontSetting.value.currency_symbol
        : "$";

    const yFormatter = (value) => {
        const currencySymbol = currency ? currency : "";
        return currencySymbolHandling(
            allConfigData,
            currencySymbol,
            value,
            true
        );
    };

    const dates = weekSalePurchase && weekSalePurchase.dates ? weekSalePurchase.dates : [];
    const formattedDates = dates.map(d => moment(d).format('ddd'));
    const sales = weekSalePurchase && weekSalePurchase.sales ? weekSalePurchase.sales : [];
    const purchases = weekSalePurchase && weekSalePurchase.purchases ? weekSalePurchase.purchases : [];

    // ApexCharts Bar Config
    const barOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 600
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '22px',
                borderRadius: 4,
                endingShape: 'rounded'
            }
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: formattedDates,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: {
                    colors: '#64748B',
                    fontSize: '12px',
                    fontWeight: 500
                }
            }
        },
        yaxis: {
            labels: {
                formatter: (val) => yFormatter(val),
                style: {
                    colors: '#64748B',
                    fontSize: '12px',
                    fontWeight: 500
                }
            }
        },
        fill: {
            opacity: 1,
            colors: ['#15803D', '#64748B'],
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: "vertical",
                shadeIntensity: 0.1,
                gradientToColors: ['#22C55E', '#94A3B8'],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        grid: {
            borderColor: '#F1F5F9',
            strokeDashArray: 4,
            yaxis: {
                lines: { show: true }
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            labels: { colors: '#334155' },
            markers: {
                width: 10,
                height: 10,
                radius: 12,
                fillColors: ['#15803D', '#64748B']
            },
            itemMargin: {
                horizontal: 12,
                vertical: 0
            }
        },
        tooltip: {
            theme: 'light',
            y: {
                formatter: (val) => yFormatter(val)
            }
        }
    };

    const barSeries = [
        {
            name: placeholderText("sales.title"),
            data: sales || []
        },
        {
            name: placeholderText("purchases.title"),
            data: purchases || []
        }
    ];

    return (
        <Row className="g-4 mb-4">
            <Col xl={7} col={12}>
                <Card className="dashboard-panel">
                    <Card.Header>
                        <h5 className="mb-0">Sales Overview <span>(This Week)</span></h5>
                        <button className="dashboard-period-button">This Week <span>⌄</span></button>
                    </Card.Header>
                    <Card.Body style={{ minHeight: '320px' }}>
                        {dates.length > 0 ? (
                            <Chart
                                options={barOptions}
                                series={barSeries}
                                type="bar"
                                height={320}
                            />
                        ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 text-gray-400">
                                No Data Available
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
            <Col xl={5} col={12}>
                <Card className="dashboard-panel">
                    <Card.Header>
                        <h5 className="mb-0">Top Selling Products ({moment(year).format("YYYY")})</h5>
                        <button className="dashboard-view-button">View All</button>
                    </Card.Header>
                    <Card.Body style={{ minHeight: '320px', display: 'flex', alignItems: 'center' }}>
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
            </Col>
        </Row>
    );
};

const mapStateToProps = (state) => {
    const { weekSalePurchase, yearTopProduct, allConfigData, allSalePurchase } = state;
    return { weekSalePurchase, yearTopProduct, allConfigData, allSalePurchase };
};

export default connect(mapStateToProps, {
    weekSalePurchases,
    yearlyTopProduct,
})(ThisWeekSalePurchaseChart);
