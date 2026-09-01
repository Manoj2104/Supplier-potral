<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LpnCarton;
use App\Models\Purchase;
use App\Models\SupplierAsn;
use App\Models\SupplierNotification;
use App\Models\Sale;
use App\Models\Product;
use App\Models\Customer;
use App\Models\ManageStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * INFY-POS Enterprise Real-Time Sync API Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Serves timestamp-delta payloads so the front-end only receives what changed.
 * Every endpoint accepts ?since=<unix_timestamp> and returns:
 *   { success, changed, last_sync, payload }
 * The JS InfySyncEngine passes last_sync back on the next tick.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class RealtimeApiController extends Controller
{
    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function supplierId(Request $request): int
    {
        $portal = $request->supplier_portal;
        return $portal ? (int) $portal->supplier_id : 1;
    }

    private function since(Request $request): Carbon
    {
        $ts = (int) $request->query('since', 0);
        return $ts > 0 ? Carbon::createFromTimestamp($ts) : Carbon::now()->subSeconds(10);
    }

    // ─── Pulse (master dashboard state for sidebar badges) ────────────────────
    public function pulse(Request $request)
    {
        $supplierId = $this->supplierId($request);
        $since      = $this->since($request);

        $poStats = Purchase::where('supplier_id', $supplierId)
            ->selectRaw('
                COUNT(*) as total_pos,
                COUNT(CASE WHEN status IN (0, 2, 3) AND (notes IS NULL OR notes NOT LIKE "%REJECTED%") THEN 1 END) as pending_pos,
                COUNT(CASE WHEN status = 1 THEN 1 END) as approved_pos
            ')
            ->first();

        $asnStats = SupplierAsn::where('supplier_id', $supplierId)
            ->selectRaw('
                COUNT(*) as total_asns,
                COUNT(CASE WHEN status IN ("dispatched", "in_transit", "out_for_delivery", "arrived", "receiving", "putaway_completed", "accepted") THEN 1 END) as dispatched_asns,
                COUNT(CASE WHEN status = "in_transit" THEN 1 END) as in_transit_asns,
                COUNT(CASE WHEN status IN ("arrived", "completed", "delivered", "verified", "receiving", "putaway_completed") THEN 1 END) as delivered_asns,
                COUNT(CASE WHEN invoice_number IS NOT NULL AND invoice_number != "" THEN 1 END) as invoice_count
            ')
            ->first();

        $unread = SupplierNotification::where('supplier_id', $supplierId)
                    ->where('is_read', false)->count();

        $totalAsns = (int)($asnStats->total_asns ?? 0);
        $invoicesCount = (int)($asnStats->invoice_count ?? 0);
        if ($invoicesCount === 0) $invoicesCount = $totalAsns;

        // Latest notification (for popup toast)
        $latestNotif = SupplierNotification::where('supplier_id', $supplierId)
            ->where('is_read', false)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->first();

        // Any carton status change since last tick?
        $cartonChanged = LpnCarton::where('supplier_id', $supplierId)
            ->where('updated_at', '>=', $since)
            ->exists();

        // Any ASN status change since last tick?
        $asnChanged = SupplierAsn::where('supplier_id', $supplierId)
            ->where('updated_at', '>=', $since)
            ->exists();

        // Any new PO since last tick?
        $newPo = Purchase::where('supplier_id', $supplierId)
            ->where('created_at', '>=', $since)
            ->exists();

        return response()->json([
            'success'       => true,
            'last_sync'     => now()->timestamp,
            'changed'       => $cartonChanged || $asnChanged || $newPo || $latestNotif,
            'counts'        => [
                'total_pos'      => (int)($poStats->total_pos ?? 0),
                'pending_pos'    => (int)($poStats->pending_pos ?? 0),
                'approved_pos'   => (int)($poStats->approved_pos ?? 0),
                'total_asns'     => $totalAsns,
                'dispatched'     => (int)($asnStats->dispatched_asns ?? 0),
                'in_transit'     => (int)($asnStats->in_transit_asns ?? 0),
                'delivered'      => (int)($asnStats->delivered_asns ?? 0),
                'invoices_count' => $invoicesCount,
                'total_products' => 1,
                'total_customers'=> 1,
                'low_stock'      => 0,
                'unread_notifs'  => $unread,
            ],
            'flags'         => [
                'carton_changed' => $cartonChanged,
                'asn_changed'    => $asnChanged,
                'new_po'         => $newPo,
            ],
            'new_notification' => $latestNotif ? [
                'id'      => $latestNotif->id,
                'title'   => $latestNotif->title,
                'message' => $latestNotif->message,
                'type'    => $latestNotif->type,
                'time'    => $latestNotif->created_at->diffForHumans(),
            ] : null,
        ]);
    }

    // ─── PO Delta ─────────────────────────────────────────────────────────────
    public function pos(Request $request)
    {
        $supplierId = $this->supplierId($request);
        $since      = $this->since($request);

        $changed = Purchase::where('supplier_id', $supplierId)
            ->where(function ($q) use ($since) {
                $q->where('created_at', '>=', $since)
                  ->orWhere('updated_at', '>=', $since);
            })
            ->with(['warehouse'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn($p) => [
                'id'             => $p->id,
                'reference_code' => $p->reference_code,
                'status'         => $p->status,
                'status_label'   => $this->poStatusLabel($p->status),
                'grand_total'    => number_format((float)$p->grand_total, 2),
                'date'           => Carbon::parse($p->date)->format('d M Y'),
                'warehouse'      => optional($p->warehouse)->name ?: 'Main Warehouse',
                'updated_at_ts'  => $p->updated_at->timestamp,
            ]);

        return response()->json([
            'success'   => true,
            'last_sync' => now()->timestamp,
            'changed'   => $changed->isNotEmpty(),
            'records'   => $changed,
        ]);
    }

    // ─── ASN Delta ────────────────────────────────────────────────────────────
    public function asns(Request $request)
    {
        $supplierId = $this->supplierId($request);
        $since      = $this->since($request);

        $changed = SupplierAsn::where('supplier_id', $supplierId)
            ->where(function ($q) use ($since) {
                $q->where('created_at', '>=', $since)
                  ->orWhere('updated_at', '>=', $since);
            })
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'asn_number'    => $a->asn_number,
                'status'        => $a->status,
                'status_label'  => $this->asnStatusLabel($a->status),
                'status_color'  => $this->asnStatusColor($a->status),
                'purchase_id'   => $a->purchase_id,
                'updated_at_ts' => $a->updated_at->timestamp,
            ]);

        return response()->json([
            'success'   => true,
            'last_sync' => now()->timestamp,
            'changed'   => $changed->isNotEmpty(),
            'records'   => $changed,
        ]);
    }

    // ─── Carton/LPN Delta ─────────────────────────────────────────────────────
    public function cartons(Request $request)
    {
        $supplierId = $this->supplierId($request);
        $since      = $this->since($request);

        $changed = LpnCarton::where('supplier_id', $supplierId)
            ->where('updated_at', '>=', $since)
            ->get()
            ->map(fn($c) => [
                'id'           => $c->id,
                'lpn_number'   => $c->lpn_number,
                'status'       => $c->status,
                'status_label' => $this->cartonStatusLabel($c->status),
                'status_color' => $this->cartonStatusColor($c->status),
                'updated_at_ts'=> $c->updated_at->timestamp,
            ]);

        return response()->json([
            'success'   => true,
            'last_sync' => now()->timestamp,
            'changed'   => $changed->isNotEmpty(),
            'records'   => $changed,
        ]);
    }

    // ─── Notifications Delta ──────────────────────────────────────────────────
    public function notifications(Request $request)
    {
        $supplierId = $this->supplierId($request);
        $since      = $this->since($request);

        $new = SupplierNotification::where('supplier_id', $supplierId)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($n) => [
                'id'      => $n->id,
                'title'   => $n->title,
                'message' => $n->message,
                'type'    => $n->type,
                'is_read' => $n->is_read,
                'time'    => $n->created_at->diffForHumans(),
            ]);

        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)
            ->where('is_read', false)->count();

        return response()->json([
            'success'      => true,
            'last_sync'    => now()->timestamp,
            'changed'      => $new->isNotEmpty(),
            'new_items'    => $new,
            'unread_count' => $unreadCount,
        ]);
    }

    // ─── Shipments Delta ──────────────────────────────────────────────────────
    public function shipments(Request $request)
    {
        $supplierId = $this->supplierId($request);
        $since      = $this->since($request);

        $changed = SupplierAsn::where('supplier_id', $supplierId)
            ->whereIn('status', ['dispatched','in_transit','arrived','receiving','verified'])
            ->where('updated_at', '>=', $since)
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'asn_number'    => $a->asn_number,
                'status'        => $a->status,
                'status_label'  => $this->asnStatusLabel($a->status),
                'status_color'  => $this->asnStatusColor($a->status),
                'purchase_id'   => $a->purchase_id,
                'updated_at_ts' => $a->updated_at->timestamp,
            ]);

        return response()->json([
            'success'   => true,
            'last_sync' => now()->timestamp,
            'changed'   => $changed->isNotEmpty(),
            'records'   => $changed,
        ]);
    }

    // ─── Mark Notification Read ───────────────────────────────────────────────
    public function markNotifRead(Request $request, $id)
    {
        $supplierId = $this->supplierId($request);
        $notif = SupplierNotification::where('supplier_id', $supplierId)->find($id);
        if ($notif) {
            $notif->update(['is_read' => true]);
        }
        return response()->json(['success' => true]);
    }

    // ─── Status Label Helpers ─────────────────────────────────────────────────
    private function poStatusLabel(int $status): string
    {
        return match($status) {
            Purchase::RECEIVED => 'Approved',
            Purchase::PENDING  => 'Pending',
            default            => 'Draft',
        };
    }

    private function asnStatusLabel(?string $status): string
    {
        return match($status) {
            'pending'           => 'Pending',
            'verified'          => 'Verified',
            'dispatched'        => 'Dispatched',
            'in_transit'        => 'In Transit',
            'arrived'           => 'Arrived at WH',
            'receiving'         => 'Receiving',
            'putaway_completed' => 'Putaway Done',
            'completed'         => 'Completed',
            default             => ucfirst($status ?? 'Unknown'),
        };
    }

    private function asnStatusColor(?string $status): string
    {
        return match($status) {
            'putaway_completed', 'completed' => '#047857',
            'arrived', 'receiving'           => '#1E40AF',
            'dispatched', 'in_transit'       => '#0E7490',
            'verified'                       => '#6D28D9',
            default                          => '#B45309',
        };
    }

    private function cartonStatusLabel(?string $status): string
    {
        return match($status) {
            'Putaway Completed'  => '✅ Putaway Completed',
            'Putaway In Progress'=> '⚡ Putaway In Progress',
            'Received at WH', 'Received' => '📥 Received at WH',
            'In Transit'         => '🚚 In Transit',
            default              => '🏷️ Ready for Dispatch',
        };
    }

    private function cartonStatusColor(?string $status): string
    {
        return match($status) {
            'Putaway Completed'   => '#047857',
            'Putaway In Progress' => '#7E22CE',
            'Received at WH', 'Received' => '#1E40AF',
            'In Transit'          => '#0E7490',
            default               => '#B45309',
        };
    }
}
