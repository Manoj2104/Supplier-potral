@php
    $refCode = $purchase->reference_code ?? ($purchaseData['po_number'] ?? 'PO-2026-000034');
    $orderDate = isset($purchase->date) ? date('d Aug Y', strtotime($purchase->date)) : ($purchaseData['date'] ?? date('d Aug Y'));
    $supplierObj = $purchase->supplier ?? null;
    $supplierName = $supplierObj->name ?? ($purchaseData['supplier_name'] ?? 'Apex Appliance Distributors');
    $supplierPhone = $supplierObj->phone ?? ($purchaseData['phone'] ?? '+91 98765 43210');
    $supplierEmail = $supplierObj->email ?? ($purchaseData['email'] ?? 'manoj8610006544@gmail.com');
    $supplierGstin = $supplierObj->gstin ?? '33AAACN1234C1Z5';
    $supplierCode = $supplierObj->code ?? 'SUP-00012';

    $warehouseName = $purchase->warehouse->name ?? 'Main Warehouse';
    $buyerName = 'Manoj S';

    $items = $purchase->purchaseItems ?? [];
    $totalItemsCount = count($items);
    $totalQty = 0;
    $calculatedSubtotal = 0;

    if ($totalItemsCount > 0) {
        foreach ($items as $itm) {
            $totalQty += ($itm->quantity ?? 1);
            $calculatedSubtotal += ($itm->sub_total ?? (($itm->quantity ?? 1) * ($itm->product_cost ?? 0)));
        }
    } else {
        $totalItemsCount = 1;
        $totalQty = 1;
    }

    $grandTotalVal = isset($purchase->grand_total) ? number_format($purchase->grand_total, 2) : '212,798.84';
    $grandTotalFormatted = '₹' . $grandTotalVal;
    $taxVal = isset($purchase->tax_amount) ? number_format($purchase->tax_amount, 2) : '0.00';
    $discountVal = isset($purchase->discount) ? number_format($purchase->discount, 2) : '0.00';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order #{{ $refCode }} Approval Request</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #F1F5F9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            line-height: 1.4;
        }
        .wrapper {
            width: 100%;
            background-color: #F1F5F9;
            padding: 20px 0;
        }
        .main-card {
            max-width: 680px;
            margin: 0 auto;
            background: #FFFFFF;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #CBD5E1;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
        }
        .btn-approve {
            background-color: #16A34A;
            color: #FFFFFF !important;
            text-decoration: none;
            font-weight: 800;
            font-size: 13px;
            padding: 10px 18px;
            border-radius: 8px;
            display: inline-block;
        }
        .btn-reject {
            background-color: #DC2626;
            color: #FFFFFF !important;
            text-decoration: none;
            font-weight: 800;
            font-size: 13px;
            padding: 10px 18px;
            border-radius: 8px;
            display: inline-block;
        }
        .btn-changes {
            background-color: #FFFFFF;
            color: #EA580C !important;
            text-decoration: none;
            font-weight: 700;
            font-size: 12px;
            padding: 9px 14px;
            border-radius: 8px;
            display: inline-block;
            border: 1px solid #FDBA74;
        }
        .btn-counter {
            background-color: #FFFFFF;
            color: #2563EB !important;
            text-decoration: none;
            font-weight: 700;
            font-size: 12px;
            padding: 9px 14px;
            border-radius: 8px;
            display: inline-block;
            border: 1px solid #93C5FD;
        }
    </style>
</head>
<body>

    <div class="wrapper">
        <div class="main-card">
            <!-- ── Top Brand Header ── -->
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 16px 24px; background: #FFFFFF; border-bottom: 1px solid #E2E8F0;">
                <tr>
                    <td align="left">
                        <span style="font-size: 20px; font-weight: 900; color: #16A34A; letter-spacing: -0.5px;">INFY-POS</span>
                        <span style="font-size: 13px; font-weight: 700; color: #475569; margin-left: 6px;">Procurement Network</span>
                    </td>
                    <td align="right">
                        <span style="font-size: 11px; font-weight: 700; color: #16A34A; background: #F0FDF4; padding: 4px 10px; border-radius: 12px; border: 1px solid #BBF7D0;">
                            🛡️ Secure Procurement Email
                        </span>
                    </td>
                </tr>
            </table>

            <!-- ── Main Banner (Dark Forest Green) ── -->
            <div style="background: #064E3B; padding: 24px; color: #FFFFFF;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td valign="top" align="left">
                            <div style="font-size: 20px; font-weight: 800;">
                                📦 Purchase Order Approval Request
                            </div>
                            <div style="font-size: 12.5px; color: #A7F3D0; margin-top: 4px;">
                                A new official Purchase Order has been generated for your company.
                            </div>
                        </td>
                        <td valign="top" align="right" width="180">
                            <div style="background: #FFFFFF; border-radius: 10px; padding: 10px 12px; text-align: left;">
                                <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">PO Number</div>
                                <div style="font-size: 15px; font-weight: 800; color: #0F172A; margin-top: 2px;">
                                    {{ $refCode }}
                                </div>
                                <div style="margin-top: 4px;">
                                    <span style="background: #FEF3C7; color: #D97706; font-weight: 800; font-size: 10.5px; padding: 2px 8px; border-radius: 10px; border: 1px solid #FDE68A;">
                                        Pending Approval
                                    </span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Clean Metadata Strip Table -->
                <table width="100%" cellpadding="6" cellspacing="0" style="margin-top: 16px; background: #043E2F; border-radius: 8px; font-size: 11px; color: #E2E8F0; text-align: center;">
                    <tr>
                        <td>📅 <strong>Date:</strong> {{ $orderDate }}</td>
                        <td>👤 <strong>Buyer:</strong> {{ $buyerName }}</td>
                        <td>🏢 <strong>Warehouse:</strong> {{ $warehouseName }}</td>
                        <td>🚚 <strong>Expected:</strong> 08 Aug 2026</td>
                        <td><span style="background: #EF4444; color: #FFFFFF; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px;">HIGH</span></td>
                    </tr>
                </table>
            </div>

            <!-- ── Body Section ── -->
            <div style="padding: 20px;">
                <!-- ── 2 Column: Supplier Details & Order Summary ── -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    <tr>
                        <td width="54%" valign="top" style="padding-right: 8px;">
                            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 14px;">
                                <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">
                                    👤 Supplier Information
                                </div>
                                <div style="font-size: 14px; font-weight: 800; color: #0F172A;">
                                    {{ $supplierName }}
                                </div>
                                <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                                    Code: {{ $supplierCode }} • GSTIN: {{ $supplierGstin }}
                                </div>

                                <table width="100%" cellpadding="2" cellspacing="0" style="margin-top: 10px; font-size: 11px; color: #475569;">
                                    <tr>
                                        <td><strong>Contact:</strong> Ravi Kumar</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Phone:</strong> {{ $supplierPhone }}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Email:</strong> {{ $supplierEmail }}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Payment Terms:</strong> 30 Days Net</td>
                                    </tr>
                                </table>
                            </div>
                        </td>

                        <td width="46%" valign="top" style="padding-left: 8px;">
                            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 14px;">
                                <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">
                                    📊 Order Summary
                                </div>
                                <table width="100%" cellpadding="3" cellspacing="0" style="font-size: 11.5px; color: #475569;">
                                    <tr>
                                        <td>Total Items</td>
                                        <td align="right" style="font-weight: 700; color: #0F172A;">{{ $totalItemsCount }} Items</td>
                                    </tr>
                                    <tr>
                                        <td>Total Quantity</td>
                                        <td align="right" style="font-weight: 700; color: #0F172A;">{{ $totalQty }} Qty</td>
                                    </tr>
                                    <tr>
                                        <td>Subtotal</td>
                                        <td align="right" style="font-weight: 700; color: #0F172A;">₹{{ number_format($calculatedSubtotal, 2) }}</td>
                                    </tr>
                                    <tr>
                                        <td>Discount</td>
                                        <td align="right" style="font-weight: 700; color: #16A34A;">- ₹{{ $discountVal }}</td>
                                    </tr>
                                    <tr>
                                        <td>GST Tax</td>
                                        <td align="right" style="font-weight: 700; color: #0F172A;">₹{{ $taxVal }}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid #CBD5E1;">
                                        <td style="padding-top: 6px; font-weight: 800; color: #0F172A;">Grand Total</td>
                                        <td align="right" style="padding-top: 6px; font-weight: 900; font-size: 15px; color: #16A34A;">
                                            {{ $grandTotalFormatted }}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- ── Products Table Card ── -->
                <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
                    <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 10px;">
                        📦 Real Purchased Products
                    </div>

                    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-size: 11px;">
                        <thead>
                            <tr style="background: #F8FAFC; border-bottom: 2px solid #E2E8F0; color: #475569; text-align: left;">
                                <th>#</th>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            @if(count($items) > 0)
                                @foreach($items as $idx => $itm)
                                    @php
                                        $prodName = $itm->product->name ?? ('Item #' . ($idx + 1));
                                        $prodSku = $itm->product->code ?? ($itm->product->sku ?? 'SKU' . ($idx + 1));
                                        $qty = $itm->quantity ?? 1;
                                        $price = $itm->net_unit_cost ?? ($itm->product_cost ?? 0);
                                        $sub = $itm->sub_total ?? ($qty * $price);
                                    @endphp
                                    <tr style="border-bottom: 1px solid #F1F5F9;">
                                        <td>{{ $idx + 1 }}</td>
                                        <td style="font-weight: 700; color: #0F172A;">{{ $prodName }}</td>
                                        <td style="font-family: monospace; color: #475569;">{{ $prodSku }}</td>
                                        <td style="font-weight: 700;">{{ $qty }}</td>
                                        <td>₹{{ number_format($price, 2) }}</td>
                                        <td style="text-align: right; font-weight: 800; color: #0F172A;">₹{{ number_format($sub, 2) }}</td>
                                    </tr>
                                @endforeach
                            @else
                                <tr style="border-bottom: 1px solid #F1F5F9;">
                                    <td>1</td>
                                    <td style="font-weight: 700; color: #0F172A;">Samsung 55 Inch 4K Ultra HD Smart TV</td>
                                    <td style="font-family: monospace; color: #475569;">SAM55UHD</td>
                                    <td style="font-weight: 700;">10</td>
                                    <td>₹32,000.00</td>
                                    <td style="text-align: right; font-weight: 800; color: #0F172A;">₹3,20,000.00</td>
                                </tr>
                            @endif
                        </tbody>
                    </table>
                </div>

                <!-- ── Attachments & Take Action Grid ── -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    <tr>
                        <!-- Left: Attachment Card -->
                        <td width="46%" valign="top" style="padding-right: 8px;">
                            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 14px;">
                                <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">
                                    📎 Attached Document
                                </div>
                                <div style="background: #FAFAFA; border: 1px dashed #CBD5E1; border-radius: 8px; padding: 8px; display: flex; align-items: center; justify-content: space-between;">
                                    <div>
                                        <div style="font-size: 11px; font-weight: 700; color: #0F172A;">📄 {{ $refCode }}.pdf</div>
                                        <div style="font-size: 10px; color: #64748B;">245 KB • Official PO</div>
                                    </div>
                                </div>
                            </div>
                        </td>

                        <!-- Right: Action Buttons Card -->
                        <td width="54%" valign="top" style="padding-left: 8px;">
                            <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 10px; padding: 14px;">
                                <div style="font-size: 13.5px; font-weight: 800; color: #166534; margin-bottom: 4px;">
                                    ✔ Review & Take Action
                                </div>
                                <div style="font-size: 11px; color: #15803D; margin-bottom: 10px;">
                                    Approve or Reject this purchase request directly:
                                </div>

                                <table width="100%" cellpadding="2" cellspacing="0">
                                    <tr>
                                        <td width="50%">
                                            <a href="{{ $approvalUrl ?? '#' }}" class="btn-approve" style="display: block; text-align: center;">
                                                ✔ Approve Order
                                            </a>
                                        </td>
                                        <td width="50%">
                                            <a href="{{ $rejectUrl ?? '#' }}" class="btn-reject" style="display: block; text-align: center;">
                                                ✖ Reject Order
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="50%" style="padding-top: 4px;">
                                            <a href="{{ $approvalUrl ?? '#' }}" class="btn-changes" style="display: block; text-align: center;">
                                                ✏ Request Changes
                                            </a>
                                        </td>
                                        <td width="50%" style="padding-top: 4px;">
                                            <a href="{{ $approvalUrl ?? '#' }}" class="btn-counter" style="display: block; text-align: center;">
                                                🔄 Counter Offer
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- ── 3 Column Details (Delivery | Buyer | Timeline) ── -->
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 11px; margin-bottom: 16px;">
                    <tr>
                        <td width="33%" valign="top" style="padding-right: 6px;">
                            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px;">
                                <div style="font-weight: 800; color: #0F172A; margin-bottom: 4px;">🚚 Delivery Details</div>
                                <div style="color: #475569;">
                                    Address: Main Warehouse, INFY-POS Park, Coimbatore<br />
                                    Mode: Road Logistics
                                </div>
                            </div>
                        </td>

                        <td width="33%" valign="top" style="padding: 0 3px;">
                            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px;">
                                <div style="font-weight: 800; color: #0F172A; margin-bottom: 4px;">👤 Buyer Info</div>
                                <div style="color: #0F172A; font-weight: 700;">{{ $buyerName }}</div>
                                <div style="color: #64748B;">Procurement Dept</div>
                            </div>
                        </td>

                        <td width="34%" valign="top" style="padding-left: 6px;">
                            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px;">
                                <div style="font-weight: 800; color: #0F172A; margin-bottom: 4px;">⏱ Order Timeline</div>
                                <div style="color: #16A34A; font-weight: 700;">1. Submitted ✓</div>
                                <div style="color: #D97706; font-weight: 800;">2. Pending Approval ⏳</div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- ── Dark Footer ── -->
            <div style="background: #064E3B; color: #FFFFFF; padding: 20px; font-size: 11px; text-align: center;">
                <div style="font-size: 15px; font-weight: 900; color: #FFFFFF;">
                    INFY-POS Procurement Network
                </div>
                <div style="color: #A7F3D0; margin-top: 4px;">
                    INFY-POS Enterprise Pvt Ltd • Support: support@infypos.com
                </div>
                <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.15); color: #6EE7B7; font-size: 10px;">
                    © {{ date('Y') }} INFY-POS Enterprise Pvt Ltd. All rights reserved.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
