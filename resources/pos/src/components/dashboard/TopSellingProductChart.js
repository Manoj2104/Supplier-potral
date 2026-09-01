import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { Row, Col } from 'react-bootstrap';
import { currencySymbolHandling } from '../../shared/sharedMethod';

const TopSellingProductChart = (props) => {
    const { yearTopProduct, allSalePurchase, allConfigData, frontSetting } = props;
    const allQuantity = yearTopProduct && yearTopProduct.total_quantity ? yearTopProduct.total_quantity : [];
    const allName = yearTopProduct && yearTopProduct.name ? yearTopProduct.name : [];
    const [series, setSeries] = useState([]);
    const [labels, setLabels] = useState([]);

    useEffect(() => {
        if (allQuantity && allName && allQuantity.length > 0) {
            setSeries(allQuantity.map(q => Number(q)));
            setLabels(allName);
        } else {
            setSeries([]);
            setLabels([]);
        }
    }, [yearTopProduct]);

    const currency = frontSetting?.value?.currency_symbol || "$";
    const totalSalesValue = allSalePurchase && allSalePurchase.all_sales_count
        ? currencySymbolHandling(allConfigData, currency, allSalePurchase.all_sales_count, true)
        : "0.00";

    const chartColors = ['#15803D', '#22C55E', '#86EFAC', '#F59E0B', '#EF4444', '#CBD5E1'];
    const totalQty = series.reduce((a, b) => a + b, 0);

    const chartOptions = {
        chart: {
            type: 'donut',
            fontFamily: 'Inter, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 600
            }
        },
        colors: chartColors,
        labels: labels,
        stroke: { show: false },
        dataLabels: { enabled: false },
        legend: { show: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '76%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#64748B',
                            offsetY: -4
                        },
                        value: {
                            show: true,
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#111827',
                            offsetY: 8,
                            formatter: () => totalSalesValue
                        },
                        total: {
                            show: true,
                            label: 'Total Sales',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#64748B',
                            formatter: () => totalSalesValue
                        }
                    }
                }
            }
        },
        tooltip: {
            theme: 'light',
            y: {
                formatter: (val) => `${val} units`
            }
        }
    };

    return (
        <Row className="align-items-center w-100 g-2 m-0">
            {series.length > 0 ? (
                <>
                    <Col xs={12} md={5} className="d-flex justify-content-center p-0">
                        <div style={{ width: '100%', maxWidth: '190px' }}>
                            <Chart
                                options={chartOptions}
                                series={series}
                                type="donut"
                                width="100%"
                                height={200}
                            />
                        </div>
                    </Col>
                    <Col xs={12} md={7} className="p-0">
                        <div className="d-flex flex-column gap-2 ps-3">
                            {labels.map((label, idx) => {
                                const qty = series[idx] || 0;
                                const pctStr = totalQty > 0 ? `${((qty / totalQty) * 100).toFixed(1)}%` : "0%";
                                const dotColor = chartColors[idx % chartColors.length];

                                return (
                                    <div key={idx} className="d-flex align-items-center justify-content-between py-1">
                                        <div className="d-flex align-items-center gap-2" style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                                            <span style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: dotColor,
                                                flexShrink: 0
                                            }} />
                                            <span className="text-gray-700 fw-medium text-truncate" style={{ fontSize: '11px', lineHeight: '1.2' }} title={label}>
                                                {label}
                                            </span>
                                        </div>
                                        <span className="text-gray-900 fw-bold" style={{ fontSize: '11px', flexShrink: 0 }}>
                                            {pctStr}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Col>
                </>
            ) : (
                <Col xs={12} className="text-center text-gray-400 py-4">
                    No Data Available
                </Col>
            )}
        </Row>
    );
};

export default TopSellingProductChart;
