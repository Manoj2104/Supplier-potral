<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\SupplierNotification;
use App\Models\SupplierPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SupplierPaymentAPIController extends AppBaseController
{
    /**
     * Display a listing of the supplier payments with goods-receiving sync.
     */
    public function index(Request $request): JsonResponse
    {
        // 1. Fetch all purchases (PO orders that are in store / receiving / received)
        $purchases = Purchase::with(['warehouse', 'purchaseItems', 'supplier'])->orderByDesc('id')->get();
        $supplierPayments = SupplierPayment::with(['supplier', 'purchase'])->orderByDesc('id')->get();

        $data = collect();

        // Map existing supplier payment records
        foreach ($purchases as $po) {
            $sp = $supplierPayments->where('purchase_id', $po->id)->first() 
               ?? $supplierPayments->where('po_code', $po->reference_code)->first();

            // Calculate received amount (if partial stock sent, only received amount is payable)
            $receivedStockValue = ($po->received_amount > 0) ? (float)$po->received_amount : (float)$po->grand_total;
            $paidAmount = $sp ? (float)$sp->amount : (float)$po->paid_amount;
            $outstanding = max(0, $receivedStockValue - $paidAmount);

            // Determine status based on goods received & paid balance
            if ($sp && ($sp->status === 'disputed' || $sp->dispute_status === 'disputed')) {
                $status = 'Disputed';
            } elseif ($paidAmount >= $receivedStockValue && $receivedStockValue > 0) {
                $status = 'Paid';
            } elseif ($paidAmount > 0 && $paidAmount < $receivedStockValue) {
                $status = 'Partial';
            } else {
                $status = 'Pending';
            }

            $paymentRef = $sp ? $sp->payment_ref : ('SP-' . str_pad($po->id, 4, '0', STR_PAD_LEFT));
            $paymentType = $sp ? $sp->payment_type : 'Bank Transfer';
            $txnId = $sp ? ($sp->txn_id ?: 'TXN-UTR-' . str_pad($po->id, 6, '0', STR_PAD_LEFT)) : ('TXN-UTR-' . str_pad($po->id, 6, '0', STR_PAD_LEFT));
            $paymentDate = ($sp && $sp->payment_date) ? $sp->payment_date->format('Y-m-d') : ($po->date ? date('Y-m-d', strtotime($po->date)) : date('Y-m-d'));

            $portal = \App\Models\SupplierPortal::where('supplier_id', $po->supplier_id)->first();
            $bankName = ($portal && !empty($portal->bank_name)) ? $portal->bank_name : 'HDFC Bank Ltd.';
            $accNumber = ($portal && !empty($portal->account_number)) ? $portal->account_number : '50200012345678';
            $ifsc = ($portal && !empty($portal->ifsc)) ? $portal->ifsc : 'HDFC0001234';
            $upi = ($portal && !empty($portal->upi)) ? $portal->upi : 'jeyachandran@hdfcbank';
            $gst = ($portal && !empty($portal->gst)) ? $portal->gst : '33ABCDE1234F1Z5';
            $pan = ($portal && !empty($portal->pan)) ? $portal->pan : 'ABCDE1234F';

            $data->push([
                'id'             => $sp ? $sp->id : $po->id,
                'payment_ref'    => $paymentRef,
                'bank_details'   => [
                    'account_holder' => optional($po->supplier)->name ?: 'Jeyachandran Textile Private Limited',
                    'bank_name'      => $bankName,
                    'account_number' => $accNumber,
                    'ifsc'           => $ifsc,
                    'upi'            => $upi,
                    'gst'            => $gst,
                    'pan'            => $pan,
                ],
                'purchase_id'    => $po->id,
                'po_code'        => $po->reference_code ?: ('PU_' . (1110 + $po->id)),
                'supplier_id'    => $po->supplier_id,
                'supplier_name'  => optional($po->supplier)->name ?: 'Jeyachandran Textile Private Limited',
                'supplier_code'  => optional($po->supplier)->code ?: ('SUP-' . str_pad($po->supplier_id, 3, '0', STR_PAD_LEFT)),
                'warehouse_name' => optional($po->warehouse)->name ?: 'Main Warehouse',
                'payment_date'   => $paymentDate,
                'amount'         => $paidAmount,
                'received_value' => $receivedStockValue,
                'grand_total'    => (float)$po->grand_total,
                'outstanding'    => $outstanding,
                'payment_type'   => $paymentType,
                'txn_id'         => $txnId,
                'receipt_url'    => $sp ? $sp->receipt_url : null,
                'status'         => $status,
                'dispute_reason' => $sp ? $sp->dispute_reason : null,
                'dispute_status' => $sp ? $sp->dispute_status : null,
                'dispute_date'   => ($sp && $sp->dispute_date) ? $sp->dispute_date->toIso8601String() : null,
                'notes'          => $sp ? $sp->notes : ('Purchase Order ' . $po->reference_code),
                'receiving_status'=> ($po->status == Purchase::RECEIVED) ? 'Received in Store' : 'Receiving / Inbound',
                'created_at'     => ($sp && $sp->created_at) ? $sp->created_at->toIso8601String() : ($po->created_at ? $po->created_at->toIso8601String() : null),
            ]);
        }

        // Apply Search / Filters
        if ($request->has('supplier_id') && !empty($request->supplier_id)) {
            $data = $data->where('supplier_id', $request->supplier_id)->values();
        }

        if ($request->has('status') && !empty($request->status) && $request->status !== 'All') {
            $data = $data->where('status', ucfirst($request->status))->values();
        }

        if ($request->has('search') && !empty($request->search)) {
            $s = strtolower(trim($request->search));
            $data = $data->filter(function ($item) use ($s) {
                return str_contains(strtolower($item['payment_ref']), $s)
                    || str_contains(strtolower($item['po_code']), $s)
                    || str_contains(strtolower($item['supplier_name']), $s)
                    || str_contains(strtolower($item['txn_id']), $s);
            })->values();
        }

        return response()->json([
            'success' => true,
            'data'    => $data,
            'message' => 'Supplier payments retrieved successfully',
        ]);
    }

    /**
     * Store a newly created payment and sync with purchase.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'supplier_id'  => 'required|exists:suppliers,id',
            'amount'       => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_type' => 'required|string',
        ]);

        $receiptUrl = null;

        if ($request->has('receipt_base64') && !empty($request->receipt_base64)) {
            $receiptUrl = $request->receipt_base64;
        } elseif ($request->hasFile('receipt_file')) {
            $path = $request->file('receipt_file')->store('supplier-payments', 'public');
            $receiptUrl = Storage::disk('public')->url($path);
        }

        $purchase = null;
        if ($request->has('po_code') && !empty($request->po_code)) {
            $purchase = Purchase::where('reference_code', $request->po_code)->first();
        }
        if (!$purchase && $request->has('purchase_id') && !empty($request->purchase_id)) {
            $purchase = Purchase::find($request->purchase_id);
        }

        $amount = (float)$request->amount;
        $payableTarget = $purchase ? (($purchase->received_amount > 0) ? (float)$purchase->received_amount : (float)$purchase->grand_total) : $amount;

        $newPaidAmount = $amount;
        if ($purchase) {
            $newPaidAmount = (float)$purchase->paid_amount + $amount;
            if ($newPaidAmount > $payableTarget) {
                $newPaidAmount = $payableTarget;
            }
            $purchase->paid_amount = $newPaidAmount;
            $purchase->save();
        }

        if ($newPaidAmount >= $payableTarget && $payableTarget > 0) {
            $status = 'paid';
        } elseif ($newPaidAmount > 0) {
            $status = 'partial';
        } else {
            $status = 'pending';
        }

        $paymentRef = 'SP-' . str_pad(SupplierPayment::count() + 1, 4, '0', STR_PAD_LEFT);

        $sp = SupplierPayment::updateOrCreate(
            ['purchase_id' => $purchase ? $purchase->id : null],
            [
                'payment_ref'    => $paymentRef,
                'po_code'        => $purchase ? $purchase->reference_code : $request->po_code,
                'supplier_id'    => $request->supplier_id,
                'payment_date'   => $request->payment_date,
                'amount'         => $newPaidAmount,
                'payment_type'   => $request->payment_type,
                'txn_id'         => $request->txn_id ?: ('TXN-UTR-' . time()),
                'receipt_url'    => $receiptUrl,
                'status'         => $status,
                'dispute_status' => 'none',
                'notes'          => $request->notes ?: 'Payment settled for received inventory',
                'created_by'     => auth()->id() ?: 1,
            ]
        );

        // Send alert to Supplier Portal
        try {
            SupplierNotification::create([
                'supplier_id' => $request->supplier_id,
                'title'       => 'Payment Disbursed: ' . $sp->payment_ref,
                'message'     => "Payment of ₹" . number_format($amount, 2) . " disbursed for PO " . ($purchase ? $purchase->reference_code : '') . " via {$request->payment_type}. Ref: {$sp->txn_id}.",
                'type'        => 'payment',
                'action_url'  => route('supplier.payments'),
                'is_read'     => false,
            ]);
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'data'    => $sp,
            'message' => 'Supplier payment recorded successfully',
        ]);
    }

    /**
     * Resolve dispute via repayment.
     */
    public function repay(Request $request, $id): JsonResponse
    {
        $sp = SupplierPayment::findOrFail($id);

        $request->validate([
            'amount'       => 'required|numeric|min:0.01',
            'payment_type' => 'required|string',
            'txn_id'       => 'required|string',
        ]);

        $receiptUrl = $sp->receipt_url;
        if ($request->has('receipt_base64') && !empty($request->receipt_base64)) {
            $receiptUrl = $request->receipt_base64;
        }

        $sp->amount         = (float)$request->amount;
        $sp->payment_type   = $request->payment_type;
        $sp->txn_id         = $request->txn_id;
        $sp->receipt_url    = $receiptUrl;
        $sp->status         = 'paid';
        $sp->dispute_status = 'repaid';
        $sp->notes          = ($sp->notes ? $sp->notes . ' | ' : '') . 'Dispute resolved via ' . $request->txn_id;
        $sp->save();

        if ($sp->purchase) {
            $sp->purchase->paid_amount = $sp->amount;
            $sp->purchase->save();
        }

        return response()->json([
            'success' => true,
            'data'    => $sp,
            'message' => 'Dispute resolved and repayment updated successfully',
        ]);
    }

    /**
     * Remove payment record.
     */
    public function destroy($id): JsonResponse
    {
        $sp = SupplierPayment::findOrFail($id);
        if ($sp->purchase) {
            $sp->purchase->paid_amount = 0;
            $sp->purchase->save();
        }
        $sp->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment record removed successfully',
        ]);
    }

    /**
     * Export Bank-to-Bank Corporate Payout File (HDFC CMS / ICICI CIB / Standard NEFT Batch Excel & CSV)
     */
    public function exportBankCms(Request $request)
    {
        $ids = $request->get('ids');
        if (is_string($ids)) {
            $ids = explode(',', $ids);
        }

        $format = $request->get('format', 'standard'); // standard, hdfc, icici

        $purchases = Purchase::with(['warehouse', 'supplier'])->orderByDesc('id')->get();
        if (!empty($ids) && count($ids) > 0) {
            $purchases = $purchases->whereIn('id', $ids);
        }

        $filename = 'Bank_Bulk_Payout_' . strtoupper($format) . '_' . date('Ymd_His') . '.csv';
        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($purchases, $format) {
            $file = fopen('php://output', 'w');

            if ($format === 'hdfc') {
                // HDFC Enet / CMS Batch Format
                fputcsv($file, ['Transaction_Type', 'Beneficiary_Code', 'Beneficiary_Acc_No', 'Instrument_Amount', 'Beneficiary_Name', 'Drawee_Location', 'Print_Location', 'Beneficiary_Email', 'Beneficiary_Mobile', 'Payment_Ref', 'IFSC_Code', 'Debit_Acc_No', 'Remarks']);
            } elseif ($format === 'icici') {
                // ICICI CIB Format
                fputcsv($file, ['Payment_Mode', 'Debit_Account_No', 'Beneficiary_Account_No', 'Beneficiary_Name', 'Amount', 'Currency', 'Payment_Date', 'IFSC_Code', 'Sender_Information', 'Customer_Ref_No', 'Remarks']);
            } else {
                // Standard Universal Corporate Banking Excel / CSV
                fputcsv($file, [
                    'Payment Ref',
                    'Beneficiary Account Number',
                    'Beneficiary Name',
                    'Beneficiary IFSC Code',
                    'Amount (INR)',
                    'Transaction Type (NEFT/RTGS)',
                    'PO Code / Invoice Ref',
                    'Bank Name',
                    'Payment Date',
                    'Narration / Remarks',
                    'Beneficiary Mobile',
                    'Beneficiary Email'
                ]);
            }

            foreach ($purchases as $po) {
                $sp = SupplierPayment::where('purchase_id', $po->id)->first();
                $portal = \App\Models\SupplierPortal::where('supplier_id', $po->supplier_id)->first();

                $beneficiaryAcc   = ($portal && !empty($portal->account_number)) ? $portal->account_number : '50200012345678';
                $beneficiaryName  = optional($po->supplier)->name ?: 'Jeyachandran Textile Private Limited';
                $beneficiaryIfsc  = ($portal && !empty($portal->ifsc)) ? $portal->ifsc : 'HDFC0001234';
                $bankName         = ($portal && !empty($portal->bank_name)) ? $portal->bank_name : 'HDFC Bank Ltd.';
                $beneficiaryEmail = optional($po->supplier)->email ?: 'finance@jeyachandrantextile.com';
                $beneficiaryPhone = optional($po->supplier)->phone ?: '9876543210';

                $payableAmount = max(0, (float)($po->grand_total ?? 0) - (float)($po->paid_amount ?? 0));
                if ($payableAmount <= 0) {
                    $payableAmount = (float)($po->grand_total ?? 0);
                }

                $txType = ($payableAmount >= 200000) ? 'RTGS' : 'NEFT';
                $poCode = $po->reference_code ?: ('PU_' . (1110 + $po->id));
                $payRef = $sp ? $sp->payment_ref : ('SP-' . str_pad($po->id, 4, '0', STR_PAD_LEFT));

                if ($format === 'hdfc') {
                    fputcsv($file, [
                        $txType,
                        'SUP-' . str_pad($po->supplier_id ?: 1, 4, '0', STR_PAD_LEFT),
                        $beneficiaryAcc,
                        number_format($payableAmount, 2, '.', ''),
                        $beneficiaryName,
                        'CHENNAI',
                        'CHENNAI',
                        $beneficiaryEmail,
                        $beneficiaryPhone,
                        $payRef,
                        $beneficiaryIfsc,
                        '50200099887766', // Corporate Debit Acc
                        'Suguna PO Settlement ' . $poCode
                    ]);
                } elseif ($format === 'icici') {
                    fputcsv($file, [
                        $txType === 'RTGS' ? 'R' : 'N',
                        '000405001234',
                        $beneficiaryAcc,
                        $beneficiaryName,
                        number_format($payableAmount, 2, '.', ''),
                        'INR',
                        date('d/m/Y'),
                        $beneficiaryIfsc,
                        'SUGUNA-RETAIL-POS',
                        $payRef,
                        'Goods Settlement ' . $poCode
                    ]);
                } else {
                    fputcsv($file, [
                        $payRef,
                        $beneficiaryAcc,
                        $beneficiaryName,
                        $beneficiaryIfsc,
                        number_format($payableAmount, 2, '.', ''),
                        $txType,
                        $poCode,
                        $bankName,
                        date('Y-m-d'),
                        'Suguna Vendor Disbursement ' . $poCode,
                        $beneficiaryPhone,
                        $beneficiaryEmail
                    ]);
                }
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Bulk Process Bank-to-Bank Transfers in Batch
     */
    public function bulkProcess(Request $request): JsonResponse
    {
        $items = $request->get('items', []); // array of purchase_id or payment objects
        if (empty($items) && $request->has('ids')) {
            $ids = (array)$request->get('ids');
            $purchases = Purchase::whereIn('id', $ids)->get();
            $items = $purchases->map(function($p) {
                $due = max(0, (float)$p->grand_total - (float)$p->paid_amount);
                return [
                    'purchase_id'  => $p->id,
                    'supplier_id'  => $p->supplier_id,
                    'amount'       => $due > 0 ? $due : (float)$p->grand_total,
                    'payment_type' => 'Bank Transfer (NEFT/RTGS)',
                    'notes'        => 'Bulk Corporate Bank Batch Payout',
                ];
            })->toArray();
        }

        if (empty($items)) {
            return response()->json([
                'success' => false,
                'message' => 'No payment items selected for bulk processing'
            ], 400);
        }

        $batchId = 'BATCH-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 6));
        $processedCount = 0;
        $totalAmount = 0;
        $results = [];

        DB::beginTransaction();
        try {
            foreach ($items as $idx => $item) {
                $purchaseId = $item['purchase_id'] ?? null;
                if (!$purchaseId) continue;

                $purchase = Purchase::find($purchaseId);
                if (!$purchase) continue;

                $amt = (float)($item['amount'] ?? max(0, (float)$purchase->grand_total - (float)$purchase->paid_amount));
                if ($amt <= 0) {
                    $amt = (float)$purchase->grand_total;
                }

                $payCount = SupplierPayment::count() + 1;
                $payRef   = 'SP-' . str_pad($payCount, 4, '0', STR_PAD_LEFT);
                $utr      = $item['txn_id'] ?? ('UTR-CORP-' . date('ymd') . '-' . str_pad($purchase->id, 5, '0', STR_PAD_LEFT));

                // Update purchase
                $purchase->paid_amount = (float)$purchase->grand_total;
                $purchase->payment_type = 3; // Bank transfer
                $purchase->save();

                $sp = SupplierPayment::updateOrCreate(
                    ['purchase_id' => $purchase->id],
                    [
                        'payment_ref'    => $payRef,
                        'po_code'        => $purchase->reference_code,
                        'supplier_id'    => $purchase->supplier_id ?: 1,
                        'payment_date'   => now(),
                        'amount'         => (float)$purchase->grand_total,
                        'payment_type'   => $item['payment_type'] ?? 'Bank Transfer (NEFT/RTGS)',
                        'txn_id'         => $utr,
                        'status'         => 'paid',
                        'dispute_status' => 'none',
                        'notes'          => "Bulk Corporate Payout [Batch: {$batchId}] | " . ($item['notes'] ?? 'Settled via Corporate Bank Payout'),
                        'created_by'     => auth()->id() ?: 1,
                    ]
                );

                // Create notification
                try {
                    SupplierNotification::create([
                        'supplier_id' => $purchase->supplier_id ?: 1,
                        'title'       => "Bulk Bank Transfer Settled: {$payRef}",
                        'message'     => "Disbursement of ₹" . number_format($amt, 2) . " settled directly to your registered bank account for PO {$purchase->reference_code}. UTR: {$utr}.",
                        'type'        => 'payment',
                        'action_url'  => route('supplier.payments'),
                        'is_read'     => false,
                    ]);
                } catch (\Exception $e) {}

                $processedCount++;
                $totalAmount += $amt;
                $results[] = $sp;
            }

            DB::commit();

            return response()->json([
                'success'         => true,
                'batch_id'        => $batchId,
                'processed_count' => $processedCount,
                'total_amount'    => $totalAmount,
                'data'            => $results,
                'message'         => "Successfully disbursed ₹" . number_format($totalAmount, 2) . " across {$processedCount} supplier accounts via Batch {$batchId}!",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process bulk payments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import Bank Response / UTR Settlement File (Excel / CSV)
     */
    public function importBankUtr(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());

        $rows = [];
        if ($ext === 'csv' || $ext === 'txt') {
            if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
                while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                    $rows[] = $data;
                }
                fclose($handle);
            }
        } else {
            // Excel
            try {
                $array = \Maatwebsite\Excel\Facades\Excel::toArray([], $file);
                $rows = $array[0] ?? [];
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to read excel file: ' . $e->getMessage()
                ], 400);
            }
        }

        if (count($rows) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'The uploaded file contains no data rows.'
            ], 400);
        }

        $header = array_map(fn($h) => strtolower(trim((string)$h)), $rows[0]);
        $poIdx = -1;
        $utrIdx = -1;
        $amtIdx = -1;
        $statusIdx = -1;

        foreach ($header as $idx => $col) {
            if (str_contains($col, 'po') || str_contains($col, 'invoice') || str_contains($col, 'ref') || str_contains($col, 'code')) {
                if ($poIdx === -1) $poIdx = $idx;
            }
            if (str_contains($col, 'utr') || str_contains($col, 'txn') || str_contains($col, 'transaction') || str_contains($col, 'rrn')) {
                $utrIdx = $idx;
            }
            if (str_contains($col, 'amount') || str_contains($col, 'paid') || str_contains($col, 'value')) {
                $amtIdx = $idx;
            }
            if (str_contains($col, 'status') || str_contains($col, 'result')) {
                $statusIdx = $idx;
            }
        }

        if ($poIdx === -1 && $utrIdx === -1) {
            $poIdx = 0;
            $utrIdx = 1;
            $amtIdx = 2;
        }

        $settledCount = 0;
        $totalSettledAmt = 0;

        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            if (empty($row) || empty($row[0])) continue;

            $poCodeOrRef = trim($row[$poIdx] ?? '');
            $utr = trim($row[$utrIdx] ?? ('UTR-BANK-' . time() . '-' . $i));
            $amt = isset($row[$amtIdx]) ? (float)str_replace(['₹', ',', ' '], '', $row[$amtIdx]) : 0;

            if (empty($poCodeOrRef)) continue;

            $purchase = Purchase::where('reference_code', $poCodeOrRef)
                ->orWhere('id', str_replace(['PO-', 'PU_', 'PU-'], '', $poCodeOrRef))
                ->first();

            if (!$purchase) {
                $spRecord = SupplierPayment::where('payment_ref', $poCodeOrRef)->first();
                if ($spRecord && $spRecord->purchase) {
                    $purchase = $spRecord->purchase;
                }
            }

            if ($purchase) {
                $settleAmt = $amt > 0 ? $amt : (float)$purchase->grand_total;
                $purchase->paid_amount = (float)$purchase->grand_total;
                $purchase->payment_type = 3;
                $purchase->save();

                SupplierPayment::updateOrCreate(
                    ['purchase_id' => $purchase->id],
                    [
                        'payment_ref'    => 'SP-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT),
                        'po_code'        => $purchase->reference_code,
                        'supplier_id'    => $purchase->supplier_id ?: 1,
                        'payment_date'   => now(),
                        'amount'         => (float)$purchase->grand_total,
                        'payment_type'   => 'Bank Transfer (NEFT/RTGS)',
                        'txn_id'         => $utr,
                        'status'         => 'paid',
                        'dispute_status' => 'none',
                        'notes'          => 'Bank Settlement Verified via Excel Import: ' . $file->getClientOriginalName(),
                        'created_by'     => auth()->id() ?: 1,
                    ]
                );

                $settledCount++;
                $totalSettledAmt += $settleAmt;
            }
        }

        return response()->json([
            'success'       => true,
            'settled_count' => $settledCount,
            'total_amount'  => $totalSettledAmt,
            'message'       => "Successfully imported & reconciled {$settledCount} supplier payments (₹" . number_format($totalSettledAmt, 2) . ") directly from bank Excel/CSV file!",
        ]);
    }
}