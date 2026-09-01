import React, { useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import { connect } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faShoppingCart,
    faBagShopping,
    faRotateLeft,
    faRotateRight,
    faDollarSign,
    faCreditCard,
    faFileInvoice,
    faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { todaySalePurchaseCount } from "../../store/action/dashboardAction";
import Widget from "../../shared/Widget/Widget";
import { useNavigate } from "react-router-dom";
import { fetchAllSalePurchaseCount } from "../../store/action/allSalePurchaseAction";
import { getCached } from "../../store/apiCache";
import { subscribePosDataChanged } from "../../shared/posEvents";

const TodaySalePurchaseCount = (props) => {
    const {
        todaySalePurchaseCount,
        todayCount = {},
        frontSetting,
        config,
        allSalePurchase = {},
        fetchAllSalePurchaseCount,
        allConfigData,
        isInitialRefresh = false,
    } = props;
    const navigate = useNavigate();

    useEffect(() => {
        // Immediate fetch on mount
        todaySalePurchaseCount();
        fetchAllSalePurchaseCount();

        // Real-time reactive listener: auto refresh on POS transactions
        const unsubscribe = subscribePosDataChanged(() => {
            todaySalePurchaseCount();
            fetchAllSalePurchaseCount();
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const onClick = (redirect, permission) => {
        if (
            config &&
            config.filter((item) => item === permission).length !== 0
        ) {
            navigate(`/${redirect}`);
        }
    };
    // Helper to calculate 100% real dynamic percentage and badge type
    const calculateGrowth = (currentVal, previousVal, subtitleText = "vs yesterday") => {
        const curr = Number(currentVal) || 0;
        const prev = Number(previousVal) || 0;

        if (curr === 0 && prev === 0) {
            return {
                badgeText: "0%",
                badgeType: "neutral",
                subtitle: subtitleText
            };
        }
        if (prev === 0 && curr > 0) {
            return {
                badgeText: "▲ 100%",
                badgeType: "positive",
                subtitle: subtitleText
            };
        }
        if (curr === 0 && prev > 0) {
            return {
                badgeText: "▼ 100%",
                badgeType: "negative",
                subtitle: subtitleText
            };
        }
        const diff = curr - prev;
        const pct = Math.round((diff / prev) * 1000) / 10;
        if (pct > 0) {
            return {
                badgeText: `▲ ${Math.abs(pct)}%`,
                badgeType: "positive",
                subtitle: subtitleText
            };
        } else if (pct < 0) {
            return {
                badgeText: `▼ ${Math.abs(pct)}%`,
                badgeType: "negative",
                subtitle: subtitleText
            };
        } else {
            return {
                badgeText: "0%",
                badgeType: "neutral",
                subtitle: subtitleText
            };
        }
    };

    const currencySymbol = (frontSetting && frontSetting.value && frontSetting.value.currency_symbol) || "₹";

    // Read persistent cache immediately for 0ms initial render
    const cachedAll = getCached("dashboard:all_sale_purchase") || {};
    const cachedToday = getCached("dashboard:today_sale_count") || {};

    const allData = allSalePurchase.all_sales_count !== undefined ? allSalePurchase : cachedAll;
    const todayData = todayCount.today_sales !== undefined ? todayCount : cachedToday;

    const allSalesVal = parseFloat(allData.all_sales_count || 0).toFixed(2);
    const allPurchasesVal = parseFloat(allData.all_purchases_count || 0).toFixed(2);
    const allSaleReturnVal = parseFloat(allData.all_sale_return_count || 0).toFixed(2);
    const allPurchaseReturnVal = parseFloat(allData.all_purchase_return_count || 0).toFixed(2);

    const todaySalesVal = parseFloat(todayData.today_sales || 0).toFixed(2);
    const todayPurchasesVal = parseFloat(todayData.today_purchases || 0).toFixed(2);
    const todayExpenseVal = parseFloat(todayData.today_expense_count || 0).toFixed(2);
    const netProfitVal = Math.max(0, Number(todayData.today_sales || 0) - Number(todayData.today_purchases || 0) - Number(todayData.today_expense_count || 0)).toFixed(2);

    const yesterdayNetProfit = Math.max(0, Number(todayData.yesterday_sales || 0) - Number(todayData.yesterday_purchases || 0) - Number(todayData.yesterday_expense_count || 0));

    // Dynamic Growth Badge Calculations
    const salesAllGrowth = calculateGrowth(allData.this_month_sales, allData.last_month_sales, "vs last month");
    const purchasesAllGrowth = calculateGrowth(allData.this_month_purchases, allData.last_month_purchases, "vs last month");
    const saleReturnAllGrowth = calculateGrowth(allData.this_month_sale_return, allData.last_month_sale_return, "vs last month");
    const purchaseReturnAllGrowth = calculateGrowth(allData.this_month_purchase_return, allData.last_month_purchase_return, "vs last month");

    const todaySalesGrowth = calculateGrowth(todayData.today_sales, todayData.yesterday_sales, "vs yesterday");
    const todayPurchasesGrowth = calculateGrowth(todayData.today_purchases, todayData.yesterday_purchases, "vs yesterday");
    const todayExpenseGrowth = calculateGrowth(todayData.today_expense_count, todayData.yesterday_expense_count, "vs yesterday");
    const netProfitGrowth = calculateGrowth(netProfitVal, yesterdayNetProfit, "vs yesterday");

    const sparklines = todayData.sparklines || {};

    return (
        <Row className="g-4 mb-4">
            <Col className="col-12">
                <Row className="g-4">
                    {/* Card 1: Total Sales (Hero Green Gradient Card) */}
                    <Widget
                        title={getFormattedMessage("sales.title")}
                        onClick={() => onClick("app/sales", "manage_sale")}
                        allConfigData={allConfigData}
                        isDark={true}
                        isInitialRefresh={isInitialRefresh}
                        icon={<FontAwesomeIcon icon={faShoppingCart} />}
                        currency={currencySymbol}
                        value={allSalesVal}
                        badgeText={salesAllGrowth.badgeText}
                        badgeType={salesAllGrowth.badgeType}
                        subtitle={salesAllGrowth.subtitle}
                        sparklineColor="#FFFFFF"
                        sparklineData={sparklines.sales || [0, 0, 0, 0, 0, 0, 0]}
                    />

                    {/* Card 2: Total Purchases */}
                    <Widget
                        title={getFormattedMessage("purchases.title")}
                        allConfigData={allConfigData}
                        onClick={() => onClick("app/purchases", "manage_purchase")}
                        iconBg="#DCFCE7"
                        iconColor="#16A34A"
                        isInitialRefresh={isInitialRefresh}
                        icon={<FontAwesomeIcon icon={faBagShopping} />}
                        currency={currencySymbol}
                        value={allPurchasesVal}
                        badgeText={purchasesAllGrowth.badgeText}
                        badgeType={purchasesAllGrowth.badgeType}
                        subtitle={purchasesAllGrowth.subtitle}
                        sparklineColor="#16A34A"
                        sparklineData={sparklines.purchases || [0, 0, 0, 0, 0, 0, 0]}
                    />

                    {/* Card 3: Sales Returns */}
                    <Widget
                        title={getFormattedMessage("sales-return.title")}
                        allConfigData={allConfigData}
                        onClick={() => onClick("app/sale-return", "manage_sale_return")}
                        iconBg="#EFF6FF"
                        iconColor="#2563EB"
                        isInitialRefresh={isInitialRefresh}
                        icon={<FontAwesomeIcon icon={faRotateLeft} />}
                        currency={currencySymbol}
                        value={allSaleReturnVal}
                        badgeText={saleReturnAllGrowth.badgeText}
                        badgeType={saleReturnAllGrowth.badgeType}
                        subtitle={saleReturnAllGrowth.subtitle}
                        sparklineColor="#2563EB"
                        sparklineData={sparklines.sale_returns || [0, 0, 0, 0, 0, 0, 0]}
                    />

                    {/* Card 4: Purchase Returns */}
                    <Widget
                        title={getFormattedMessage("purchases.return.title")}
                        allConfigData={allConfigData}
                        onClick={() => onClick("app/purchase-return", "manage_purchase_return")}
                        iconBg="#FEF3C7"
                        iconColor="#D97706"
                        isInitialRefresh={isInitialRefresh}
                        icon={<FontAwesomeIcon icon={faRotateRight} />}
                        currency={currencySymbol}
                        value={allPurchaseReturnVal}
                        badgeText={purchaseReturnAllGrowth.badgeText}
                        badgeType={purchaseReturnAllGrowth.badgeType}
                        subtitle={purchaseReturnAllGrowth.subtitle}
                        sparklineColor="#D97706"
                        sparklineData={sparklines.purchase_returns || [0, 0, 0, 0, 0, 0, 0]}
                    />

                    {/* Card 5: Today's Sales */}
                    <Widget
                        title="Today's Sales"
                        allConfigData={allConfigData}
                        onClick={() => onClick("app/sales", "manage_sale")}
                        iconBg="#F3E8FF"
                        iconColor="#7C3AED"
                        isInitialRefresh={isInitialRefresh}
                        icon={<FontAwesomeIcon icon={faDollarSign} />}
                        currency={currencySymbol}
                        value={todaySalesVal}
                        badgeText={todaySalesGrowth.badgeText}
                        badgeType={todaySalesGrowth.badgeType}
                        subtitle={todaySalesGrowth.subtitle}
                        sparklineColor="#7C3AED"
                        sparklineData={sparklines.sales || [0, 0, 0, 0, 0, 0, 0]}
                    />

                    {/* Card 6: Today's Purchases */}
                    <Widget
                        title="Today's Purchases"
                        allConfigData={allConfigData}
                        onClick={() => onClick("app/purchases", "manage_purchase")}
                        iconBg="#FCE7F3"
                        iconColor="#DB2777"
                        isInitialRefresh={isInitialRefresh}
                        icon={<FontAwesomeIcon icon={faCreditCard} />}
                        currency={currencySymbol}
                        value={todayPurchasesVal}
                        badgeText={todayPurchasesGrowth.badgeText}
                        badgeType={todayPurchasesGrowth.badgeType}
                        subtitle={todayPurchasesGrowth.subtitle}
                        sparklineColor="#DB2777"
                        sparklineData={sparklines.purchases || [0, 0, 0, 0, 0, 0, 0]}
                    />

                    {/* Card 7: Today's Expenses */}
                    <Widget
                        title="Today's Expenses"
                        allConfigData={allConfigData}
                        onClick={() => onClick("app/expenses", "manage_expenses")}
                        iconBg="#E0F2FE"
                        iconColor="#0284C7"
                        isInitialRefresh={isInitialRefresh}
                        icon={<FontAwesomeIcon icon={faFileInvoice} />}
                        currency={currencySymbol}
                        value={todayExpenseVal}
                        badgeText={todayExpenseGrowth.badgeText}
                        badgeType={todayExpenseGrowth.badgeType}
                        subtitle={todayExpenseGrowth.subtitle}
                        sparklineColor="#0284C7"
                        sparklineData={sparklines.expenses || [0, 0, 0, 0, 0, 0, 0]}
                    />

                    {/* Card 8: Net Profit */}
                    <Widget
                        title="Net Profit"
                        allConfigData={allConfigData}
                        onClick={() => onClick("app/expenses", "manage_expenses")}
                        iconBg="#DCFCE7"
                        iconColor="#059669"
                        isInitialRefresh={isInitialRefresh}
                        icon={<FontAwesomeIcon icon={faChartLine} />}
                        currency={currencySymbol}
                        value={netProfitVal}
                        badgeText={netProfitGrowth.badgeText}
                        badgeType={netProfitGrowth.badgeType}
                        subtitle={netProfitGrowth.subtitle}
                        sparklineColor="#059669"
                        sparklineData={sparklines.net_profit || [0, 0, 0, 0, 0, 0, 0]}
                    />
                </Row>
            </Col>
        </Row>
    );
};

const mapStateToProps = (state) => {
    const { todayCount, allSalePurchase, config, allConfigData, frontSetting } = state;
    return { todayCount, allSalePurchase, config, allConfigData, frontSetting };
};

export default connect(mapStateToProps, {
    todaySalePurchaseCount,
    fetchAllSalePurchaseCount,
})(TodaySalePurchaseCount);
