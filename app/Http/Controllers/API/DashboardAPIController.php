<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Resources\SaleCollection;
use App\Http\Resources\SaleResource;
use App\Models\BaseUnit;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\ManageStock;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\SalesPayment;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardAPIController extends AppBaseController
{
    public function getPurchaseSalesCounts(): JsonResponse
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        $todaySales = (float) Sale::where('date', $today)->sum('grand_total');
        $yesterdaySales = (float) Sale::where('date', $yesterday)->sum('grand_total');

        $todayPurchases = (float) Purchase::where('date', $today)->sum('grand_total');
        $yesterdayPurchases = (float) Purchase::where('date', $yesterday)->sum('grand_total');

        $todaySaleReturn = (float) SaleReturn::where('date', $today)->sum('grand_total');
        $yesterdaySaleReturn = (float) SaleReturn::where('date', $yesterday)->sum('grand_total');

        $todayPurchaseReturn = (float) PurchaseReturn::where('date', $today)->sum('grand_total');
        $yesterdayPurchaseReturn = (float) PurchaseReturn::where('date', $yesterday)->sum('grand_total');

        $todayExpense = (float) Expense::where('date', $today)->sum('amount');
        $yesterdayExpense = (float) Expense::where('date', $yesterday)->sum('amount');

        $todaySalesReceived = (float) SalesPayment::where('payment_date', $today)->sum('amount');

        // Calculate 7-day historical arrays for sparkline graphs
        $sevenDays = [];
        for ($i = 6; $i >= 0; $i--) {
            $sevenDays[] = Carbon::today()->subDays($i)->format('Y-m-d');
        }

        $salesPerDay = Sale::whereBetween('date', [$sevenDays[0], $sevenDays[6]])
            ->groupBy('date')
            ->selectRaw('DATE_FORMAT(date, "%Y-%m-%d") as day, SUM(grand_total) as total')
            ->pluck('total', 'day');

        $purchasesPerDay = Purchase::whereBetween('date', [$sevenDays[0], $sevenDays[6]])
            ->groupBy('date')
            ->selectRaw('DATE_FORMAT(date, "%Y-%m-%d") as day, SUM(grand_total) as total')
            ->pluck('total', 'day');

        $saleReturnsPerDay = SaleReturn::whereBetween('date', [$sevenDays[0], $sevenDays[6]])
            ->groupBy('date')
            ->selectRaw('DATE_FORMAT(date, "%Y-%m-%d") as day, SUM(grand_total) as total')
            ->pluck('total', 'day');

        $purchaseReturnsPerDay = PurchaseReturn::whereBetween('date', [$sevenDays[0], $sevenDays[6]])
            ->groupBy('date')
            ->selectRaw('DATE_FORMAT(date, "%Y-%m-%d") as day, SUM(grand_total) as total')
            ->pluck('total', 'day');

        $expensesPerDay = Expense::whereBetween('date', [$sevenDays[0], $sevenDays[6]])
            ->groupBy('date')
            ->selectRaw('DATE_FORMAT(date, "%Y-%m-%d") as day, SUM(amount) as total')
            ->pluck('total', 'day');

        $salesSparkline = [];
        $purchasesSparkline = [];
        $saleReturnsSparkline = [];
        $purchaseReturnsSparkline = [];
        $expensesSparkline = [];
        $netProfitSparkline = [];

        foreach ($sevenDays as $d) {
            $s = (float) ($salesPerDay[$d] ?? 0);
            $p = (float) ($purchasesPerDay[$d] ?? 0);
            $sr = (float) ($saleReturnsPerDay[$d] ?? 0);
            $pr = (float) ($purchaseReturnsPerDay[$d] ?? 0);
            $e = (float) ($expensesPerDay[$d] ?? 0);

            $salesSparkline[] = $s;
            $purchasesSparkline[] = $p;
            $saleReturnsSparkline[] = $sr;
            $purchaseReturnsSparkline[] = $pr;
            $expensesSparkline[] = $e;
            $netProfitSparkline[] = max(0, $s - $p - $e);
        }

        $data = [
            'today_sales'                => $todaySales,
            'yesterday_sales'            => $yesterdaySales,
            'today_purchases'            => $todayPurchases,
            'yesterday_purchases'        => $yesterdayPurchases,
            'today_sale_return'          => $todaySaleReturn,
            'yesterday_sale_return'      => $yesterdaySaleReturn,
            'today_purchase_return'      => $todayPurchaseReturn,
            'yesterday_purchase_return'  => $yesterdayPurchaseReturn,
            'today_sales_received_count' => $todaySalesReceived,
            'today_expense_count'        => $todayExpense,
            'yesterday_expense_count'    => $yesterdayExpense,
            'today_net_profit'           => max(0, $todaySales - $todayPurchases - $todayExpense),
            'yesterday_net_profit'       => max(0, $yesterdaySales - $yesterdayPurchases - $yesterdayExpense),
            'sparklines'                 => [
                'sales'            => $salesSparkline,
                'purchases'        => $purchasesSparkline,
                'sale_returns'     => $saleReturnsSparkline,
                'purchase_returns' => $purchaseReturnsSparkline,
                'expenses'         => $expensesSparkline,
                'net_profit'       => $netProfitSparkline,
            ],
        ];

        return $this->sendResponse($data, 'Sales Purchase Count Retrieved Successfully');
    }

    public function getAllPurchaseSalesCounts(): JsonResponse
    {
        $allSaleReturn = (float) SaleReturn::sum('grand_total');
        $allPurchaseReturn = (float) PurchaseReturn::sum('grand_total');
        $allSales = (float) Sale::sum('grand_total');
        $allPurchases = (float) Purchase::sum('grand_total') - $allPurchaseReturn;

        $startThisMonth = Carbon::now()->startOfMonth();
        $startLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endLastMonth   = Carbon::now()->subMonth()->endOfMonth();

        $thisMonthSales = (float) Sale::where('date', '>=', $startThisMonth)->sum('grand_total');
        $lastMonthSales = (float) Sale::whereBetween('date', [$startLastMonth, $endLastMonth])->sum('grand_total');

        $thisMonthPurchases = (float) Purchase::where('date', '>=', $startThisMonth)->sum('grand_total');
        $lastMonthPurchases = (float) Purchase::whereBetween('date', [$startLastMonth, $endLastMonth])->sum('grand_total');

        $thisMonthSaleReturn = (float) SaleReturn::where('date', '>=', $startThisMonth)->sum('grand_total');
        $lastMonthSaleReturn = (float) SaleReturn::whereBetween('date', [$startLastMonth, $endLastMonth])->sum('grand_total');

        $thisMonthPurchaseReturn = (float) PurchaseReturn::where('date', '>=', $startThisMonth)->sum('grand_total');
        $lastMonthPurchaseReturn = (float) PurchaseReturn::whereBetween('date', [$startLastMonth, $endLastMonth])->sum('grand_total');

        $data = [
            'all_sales_count'            => $allSales,
            'this_month_sales'           => $thisMonthSales,
            'last_month_sales'           => $lastMonthSales,
            'all_sale_return_count'      => $allSaleReturn,
            'this_month_sale_return'     => $thisMonthSaleReturn,
            'last_month_sale_return'     => $lastMonthSaleReturn,
            'all_purchase_return_count'  => $allPurchaseReturn,
            'this_month_purchase_return' => $thisMonthPurchaseReturn,
            'last_month_purchase_return' => $lastMonthPurchaseReturn,
            'all_purchases_count'        => $allPurchases,
            'this_month_purchases'       => $thisMonthPurchases,
            'last_month_purchases'       => $lastMonthPurchases,
            'all_sales_received_count'   => (float) SalesPayment::sum('amount'),
            'all_expense_count'          => (float) Expense::sum('amount'),
        ];

        return $this->sendResponse($data, 'All Sales Purchase and returns Count Retrieved Successfully');
    }

    public function getRecentSales(): SaleCollection
    {
        $recentSales = Sale::latest()->take(5)->get();
        SaleResource::usingWithCollection();

        return new SaleCollection($recentSales);
    }

    public function getTopSellingProducts(): JsonResponse
    {
        $month = Carbon::now()->month;
        $year = Carbon::now()->year;
        $topSellings = Product::leftJoin('sale_items', 'products.id', '=', 'sale_items.product_id')
            ->whereMonth('sale_items.created_at', $month)
            ->whereYear('sale_items.created_at', $year)
            ->selectRaw('products.*, COALESCE(sum(sale_items.sub_total),0) grand_total')
            ->selectRaw('products.*, COALESCE(sum(sale_items.quantity),0) total_quantity')
            ->groupBy('products.id')
            ->orderBy('total_quantity', 'desc')
            ->latest()
            ->take(5)
            ->get();
        $res = [];
        foreach ($topSellings as $topSelling) {
            $res[] = $topSelling->prepareTopSelling();
        }

        return $this->sendResponse($res, 'Top Selling Products Retrieved Successfully');
    }

    public function getWeekSalePurchases(): JsonResponse
    {
        $count = 7;
        $days = [];
        $date = Carbon::tomorrow();
        for ($i = 0; $i < $count; $i++) {
            $days[] = $date->subDay()->format('Y-m-d');
        }
        $day['days'] = array_reverse($days);
        $sales = Sale::whereBetween('date', [$day['days'][0], $day['days'][6]])
            ->orderBy('date', 'desc')
            ->groupBy('date')
            ->get([
                DB::raw('DATE_FORMAT(date,"%Y-%m-%d") as week'),
                DB::raw('SUM(grand_total) as grand_total'),
            ])->keyBy('week');
        $period = CarbonPeriod::create($day['days'][0], $day['days'][6]);

        $res = [];
        $res['dates'] = array_map(function ($datePeriod) {
            return $datePeriod->format('Y-m-d');
        }, iterator_to_array($period));

        $res['sales'] = array_map(function ($datePeriod) use ($sales) {
            $week = $datePeriod->format('Y-m-d');
            return $sales->has($week) ? $sales->get($week)->grand_total : 0;
        }, iterator_to_array($period));

        $purchases = Purchase::whereBetween('date', [$day['days'][0], $day['days'][6]])
            ->orderBy('date', 'desc')
            ->groupBy('date')
            ->get([
                DB::raw('DATE_FORMAT(date,"%Y-%m-%d") as week'),
                DB::raw('SUM(grand_total) as grand_total'),
            ])->keyBy('week');

        $res['purchases'] = array_map(function ($datePeriod) use ($purchases) {
            $week = $datePeriod->format('Y-m-d');
            return $purchases->has($week) ? $purchases->get($week)->grand_total : 0;
        }, iterator_to_array($period));

        return $this->sendResponse($res, 'Week of Sales Purchase Retrieved Successfully');
    }

    public function getYearlyTopSelling(): JsonResponse
    {
        $year = Carbon::now()->year;
        $topSellings = Product::leftJoin('sale_items', 'products.id', '=', 'sale_items.product_id')
            ->whereYear('sale_items.created_at', $year)
            ->selectRaw('products.*, COALESCE(sum(sale_items.sub_total),0) grand_total')
            ->selectRaw('products.*, COALESCE(sum(sale_items.quantity),0) total_quantity')
            ->groupBy('products.id')
            ->orderBy('total_quantity', 'desc')
            ->take(5)
            ->get();
        $res = [];
        foreach ($topSellings as $topSelling) {
            $res['name'][] = $topSelling->name;
            $res['total_quantity'][] = $topSelling->total_quantity;
        }

        return $this->sendResponse($res, 'Yearly TopSelling Products Retrieved Successfully');
    }

    public function getTopCustomer(): JsonResponse
    {
        $month = Carbon::now()->month;
        $topCustomers = Customer::leftJoin('sales', 'customers.id', '=', 'sales.customer_id')
            ->whereMonth('date', $month)
            ->select('customers.*', DB::raw('sum(sales.grand_total) as grand_total'))
            ->groupBy('customers.id')
            ->orderBy('grand_total', 'desc')
            ->latest()
            ->take(5)
            ->get();
        $res = [];
        foreach ($topCustomers as $topCustomer) {
            $res['name'][] = $topCustomer->name;
            $res['grand_total'][] = (float) $topCustomer->grand_total;
        }

        return $this->sendResponse($res, 'Top Customers Retrieved Successfully');
    }

    public function stockAlerts(): JsonResponse
    {
        $manageStocks = ManageStock::with('warehouse')
            ->where(function($q) {
                $q->where('alert', true)
                  ->orWhere('quantity', '<=', 5);
            })
            ->limit(10)
            ->latest()
            ->get();

        $productIds = $manageStocks->pluck('product_id')->filter()->unique();
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
        $unitIds = $products->pluck('product_unit')->filter()->unique();
        $unitNames = BaseUnit::whereIn('id', $unitIds)->pluck('name', 'id');

        $res = [];
        foreach ($manageStocks as $stock) {
            $product = $products->get($stock->product_id);
            if (!empty($product)) {
                $stock['product_unit_name'] = $unitNames->get($product->product_unit, '');
                $pCopy = clone $product;
                $pCopy->stock = $stock;
                $res[] = $pCopy;
            }
        }

        return $this->sendResponse($res, 'Stocks retrieved successfully');
    }

    public function productStats(): JsonResponse
    {
        $totalProducts = Product::count();
        $lowStock = ManageStock::where('quantity', '>', 0)
            ->where(function($q) {
                $q->where('alert', true)
                  ->orWhere('quantity', '<=', 5);
            })
            ->count();
        $outOfStock = ManageStock::where('quantity', '<=', 0)->count();
        $totalValue = DB::table('manage_stocks')
            ->join('products', 'manage_stocks.product_id', '=', 'products.id')
            ->selectRaw('COALESCE(SUM(manage_stocks.quantity * products.product_price), 0) as total_val')
            ->value('total_val');

        $data = [
            'total_products' => $totalProducts,
            'low_stock'      => $lowStock,
            'out_of_stock'   => $outOfStock,
            'total_value'    => (float) $totalValue,
        ];

        return $this->sendResponse($data, 'Product Stats Retrieved Successfully');
    }

    public function quickStats(): JsonResponse
    {
        $startThisMonth = Carbon::now()->startOfMonth()->toDateTimeString();
        $startLastMonth = Carbon::now()->subMonth()->startOfMonth()->toDateTimeString();
        $endLastMonth   = Carbon::now()->subMonth()->endOfMonth()->toDateTimeString();

        $productCounts = DB::table('products')
            ->selectRaw('
                COUNT(*) as total,
                COUNT(CASE WHEN created_at >= ? THEN 1 END) as this_month,
                COUNT(CASE WHEN created_at BETWEEN ? AND ? THEN 1 END) as last_month
            ', [$startThisMonth, $startLastMonth, $endLastMonth])
            ->first();

        $customerCounts = DB::table('customers')
            ->selectRaw('
                COUNT(*) as total,
                COUNT(CASE WHEN created_at >= ? THEN 1 END) as this_month,
                COUNT(CASE WHEN created_at BETWEEN ? AND ? THEN 1 END) as last_month
            ', [$startThisMonth, $startLastMonth, $endLastMonth])
            ->first();

        $saleCounts = DB::table('sales')
            ->selectRaw('
                COUNT(*) as total,
                COUNT(CASE WHEN created_at >= ? THEN 1 END) as this_month,
                COUNT(CASE WHEN created_at BETWEEN ? AND ? THEN 1 END) as last_month
            ', [$startThisMonth, $startLastMonth, $endLastMonth])
            ->first();

        $lowStock = DB::table('manage_stocks')
            ->where(function($q) {
                $q->where('alert', true)->orWhere('quantity', '<=', 5);
            })
            ->count();

        $calcGrowth = function($curr, $prev) {
            if ($curr == 0 && $prev == 0) return ['text' => '0%', 'isPositive' => true];
            if ($prev == 0 && $curr > 0) return ['text' => '▲ 100%', 'isPositive' => true];
            if ($curr == 0 && $prev > 0) return ['text' => '▼ 100%', 'isPositive' => false];
            $diff = $curr - $prev;
            $pct = round(($diff / $prev) * 100, 1);
            if ($pct > 0) return ['text' => '▲ ' . abs($pct) . '%', 'isPositive' => true];
            if ($pct < 0) return ['text' => '▼ ' . abs($pct) . '%', 'isPositive' => false];
            return ['text' => '0%', 'isPositive' => true];
        };

        $data = [
            'total_products'   => (int) ($productCounts->total ?? 0),
            'total_customers'  => (int) ($customerCounts->total ?? 0),
            'low_stock'        => (int) $lowStock,
            'invoices_count'   => (int) ($saleCounts->total ?? 0),
            'products_growth'  => $calcGrowth((int) ($productCounts->this_month ?? 0), (int) ($productCounts->last_month ?? 0)),
            'customers_growth' => $calcGrowth((int) ($customerCounts->this_month ?? 0), (int) ($customerCounts->last_month ?? 0)),
            'invoices_growth'  => $calcGrowth((int) ($saleCounts->this_month ?? 0), (int) ($saleCounts->last_month ?? 0)),
        ];

        return $this->sendResponse($data, 'Quick stats retrieved successfully');
    }
}
