<?php

namespace App\Observers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\SupplierNotification;
use Illuminate\Support\Facades\Log;
use PDO;

/**
 * PurchaseObserver — Real-time sync to Supabase on every PO create/update.
 * Ensures supplier sees new POs instantly from any location.
 */
class PurchaseObserver
{
    private static function getSupabasePdo(): ?PDO
    {
        try {
            $dsn = sprintf(
                'pgsql:host=%s;port=%s;dbname=%s;sslmode=require',
                env('SUPABASE_DB_HOST', 'aws-0-ap-southeast-2.pooler.supabase.com'),
                env('SUPABASE_DB_PORT', '5432'),
                env('SUPABASE_DB_DATABASE', 'postgres')
            );
            return new PDO($dsn,
                env('SUPABASE_DB_USERNAME', 'postgres.ejbygpiozuaomomshazl'),
                env('SUPABASE_DB_PASSWORD', 'Manojnandhini@2104'),
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8]
            );
        } catch (\Throwable $e) {
            Log::warning('[PurchaseObserver] Supabase PDO failed: ' . $e->getMessage());
            return null;
        }
    }

    public function created(Purchase $purchase): void
    {
        $this->syncToSupabase($purchase);
        $this->createNotification($purchase, 'new_po');
    }

    public function updated(Purchase $purchase): void
    {
        $this->syncToSupabase($purchase);
        if ($purchase->isDirty('status')) {
            $this->createNotification($purchase, 'po_status_changed');
        }
    }

    private function syncToSupabase(Purchase $purchase): void
    {
        $pdo = self::getSupabasePdo();
        if (!$pdo) return;

        try {
            // Upsert purchase record
            $sql = "INSERT INTO purchases (
                        id, reference_code, supplier_id, warehouse_id, date, expected_date,
                        grand_total, paid_amount, status, notes, created_at, updated_at
                    ) VALUES (
                        :id, :reference_code, :supplier_id, :warehouse_id, :date, :expected_date,
                        :grand_total, :paid_amount, :status, :notes, :created_at, :updated_at
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        reference_code = EXCLUDED.reference_code,
                        status         = EXCLUDED.status,
                        grand_total    = EXCLUDED.grand_total,
                        paid_amount    = EXCLUDED.paid_amount,
                        notes          = EXCLUDED.notes,
                        expected_date  = EXCLUDED.expected_date,
                        updated_at     = EXCLUDED.updated_at";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id'             => $purchase->id,
                ':reference_code' => $purchase->reference_code,
                ':supplier_id'    => $purchase->supplier_id,
                ':warehouse_id'   => $purchase->warehouse_id,
                ':date'           => $purchase->date,
                ':expected_date'  => $purchase->expected_date,
                ':grand_total'    => $purchase->grand_total ?? 0,
                ':paid_amount'    => $purchase->paid_amount ?? 0,
                ':status'         => $purchase->status,
                ':notes'          => $purchase->notes,
                ':created_at'     => $purchase->created_at,
                ':updated_at'     => $purchase->updated_at ?? now(),
            ]);

            // Sync purchase items
            $items = PurchaseItem::where('purchase_id', $purchase->id)->get();
            foreach ($items as $item) {
                $itemSql = "INSERT INTO purchase_items (
                                id, purchase_id, product_id, quantity, unit_price, sub_total, created_at, updated_at
                            ) VALUES (
                                :id, :purchase_id, :product_id, :quantity, :unit_price, :sub_total, :created_at, :updated_at
                            )
                            ON CONFLICT (id) DO UPDATE SET
                                quantity   = EXCLUDED.quantity,
                                unit_price = EXCLUDED.unit_price,
                                sub_total  = EXCLUDED.sub_total,
                                updated_at = EXCLUDED.updated_at";
                $ist = $pdo->prepare($itemSql);
                $ist->execute([
                    ':id'          => $item->id,
                    ':purchase_id' => $item->purchase_id,
                    ':product_id'  => $item->product_id,
                    ':quantity'    => $item->quantity,
                    ':unit_price'  => $item->unit_price ?? 0,
                    ':sub_total'   => $item->sub_total ?? 0,
                    ':created_at'  => $item->created_at,
                    ':updated_at'  => $item->updated_at ?? now(),
                ]);
            }

            // Bust cache so supplier sees fresh data instantly
            \Illuminate\Support\Facades\Cache::forget("layout_counts_{$purchase->supplier_id}");
            \Illuminate\Support\Facades\Cache::forget("sidebar_counts_{$purchase->supplier_id}");
            \Illuminate\Support\Facades\Cache::forget("supplier_dashboard_{$purchase->supplier_id}");

            Log::info("[PurchaseObserver] Synced PO #{$purchase->id} to Supabase.");
        } catch (\Throwable $e) {
            Log::error('[PurchaseObserver] Sync failed: ' . $e->getMessage());
        }
    }

    private function createNotification(Purchase $purchase, string $type): void
    {
        try {
            $message = $type === 'new_po'
                ? "New Purchase Order #{$purchase->reference_code} has been created for you. Total: ₹" . number_format($purchase->grand_total, 2)
                : "Purchase Order #{$purchase->reference_code} status updated.";

            // Save notification in local MySQL
            SupplierNotification::create([
                'supplier_id' => $purchase->supplier_id,
                'title'       => $type === 'new_po' ? 'New Purchase Order' : 'PO Status Updated',
                'message'     => $message,
                'type'        => 'purchase_order',
                'is_read'     => false,
            ]);

            // Also push notification to Supabase directly
            $pdo = self::getSupabasePdo();
            if ($pdo) {
                $pdo->prepare("INSERT INTO supplier_notifications (supplier_id, title, message, type, is_read, created_at, updated_at)
                               VALUES (:sid, :title, :msg, :type, false, NOW(), NOW())")
                    ->execute([
                        ':sid'   => $purchase->supplier_id,
                        ':title' => $type === 'new_po' ? 'New Purchase Order' : 'PO Status Updated',
                        ':msg'   => $message,
                        ':type'  => 'purchase_order',
                    ]);
            }
        } catch (\Throwable $e) {
            Log::warning('[PurchaseObserver] Notification failed: ' . $e->getMessage());
        }
    }
}
