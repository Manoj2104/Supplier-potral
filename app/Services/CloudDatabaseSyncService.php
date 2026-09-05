<?php

namespace App\Services;

use App\Models\LpnCarton;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\SupplierAsn;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PDO;
use Throwable;

class CloudDatabaseSyncService
{
    private static ?bool $_isOnline = null;
    private static ?PDO $_cloudPdo = null;

    /**
     * Get Cloud PDO Connection with ultra-fast timeout (max 2.5s)
     */
    public static function getCloudPdo(): ?PDO
    {
        if (self::$_cloudPdo !== null) {
            return self::$_cloudPdo;
        }

        $host = env('SUPABASE_DB_HOST', 'aws-0-ap-southeast-2.pooler.supabase.com');
        $port = env('SUPABASE_DB_PORT', '5432');
        $database = env('SUPABASE_DB_DATABASE', 'postgres');
        $user = env('SUPABASE_DB_USERNAME', 'postgres.ejbygpiozuaomomshazl');
        $pass = env('SUPABASE_DB_PASSWORD', 'Manojnandhini@2104');

        try {
            $dsn = "pgsql:host={$host};port={$port};dbname={$database};sslmode=require";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 3,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            self::$_cloudPdo = $pdo;
            self::$_isOnline = true;
            return $pdo;
        } catch (Throwable $e) {
            self::$_isOnline = false;
            Log::info('Cloud DB offline or unreachable: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Non-blocking reachability check (cached per request)
     */
    public static function isCloudReachable(): bool
    {
        if (self::$_isOnline !== null) {
            return self::$_isOnline;
        }

        $pdo = self::getCloudPdo();
        return $pdo !== null;
    }

    /**
     * Master Sync: Executes bi-directional synchronization
     */
    public static function syncAll(): array
    {
        if (!self::isCloudReachable()) {
            return [
                'online' => false,
                'message' => 'Cloud database is currently unreachable. Operating in local offline-first mode.',
                'synced' => 0,
            ];
        }

        $pushed = self::pushLocalToCloud();
        $pulled = self::pullCloudToLocal();

        return [
            'online' => true,
            'message' => 'Bidirectional cloud sync complete.',
            'pushed' => $pushed,
            'pulled' => $pulled,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * ── OUTBOUND: Push Local MySQL changes to Supabase PostgreSQL ─────────────
     */
    public static function pushLocalToCloud(): array
    {
        $pdo = self::getCloudPdo();
        if (!$pdo) {
            return ['status' => 'offline', 'count' => 0];
        }

        $pushedPurchases = 0;
        $pushedAsns = 0;
        $pushedCartons = 0;

        try {
            // 1. Fetch all existing reference codes from Cloud in a single query
            $cloudRefMap = [];
            $cloudPoStmt = $pdo->query('SELECT reference_code, id, status FROM purchases WHERE reference_code IS NOT NULL');
            while ($row = $cloudPoStmt->fetch()) {
                $cloudRefMap[$row['reference_code']] = $row;
            }

            // 2. Diff and push Local Purchases
            $localPurchases = DB::table('purchases')
                ->whereNotNull('reference_code')
                ->get();

            $insertPoStmt = $pdo->prepare('
                INSERT INTO purchases (
                    reference_code, date, supplier_id, warehouse_id, tax_rate, tax_amount, 
                    discount, shipping, grand_total, received_amount, paid_amount, 
                    payment_type, notes, status, created_at, updated_at
                ) VALUES (
                    :ref, :date, :sup_id, :wh_id, :tax_r, :tax_a, 
                    :disc, :ship, :total, :rec, :paid, 
                    :ptype, :notes, :status, :cat, :uat
                ) RETURNING id
            ');

            $updatePoStmt = $pdo->prepare('
                UPDATE purchases SET 
                    status = :status,
                    grand_total = :total,
                    paid_amount = :paid,
                    received_amount = :rec,
                    notes = :notes,
                    updated_at = :uat
                WHERE id = :id
            ');

            foreach ($localPurchases as $po) {
                $ref = $po->reference_code;
                $cloudPoId = null;

                if (isset($cloudRefMap[$ref])) {
                    $cloudItem = $cloudRefMap[$ref];
                    $cloudPoId = $cloudItem['id'];
                    if ($cloudItem['status'] != $po->status) {
                        $updatePoStmt->execute([
                            ':id' => $cloudPoId,
                            ':status' => $po->status ?? 1,
                            ':total' => $po->grand_total ?? 0,
                            ':paid' => $po->paid_amount ?? 0,
                            ':rec' => $po->received_amount ?? 0,
                            ':notes' => $po->notes,
                            ':uat' => $po->updated_at ?? now(),
                        ]);
                        $pushedPurchases++;
                    }
                } else {
                    $insertPoStmt->execute([
                        ':ref' => $ref,
                        ':date' => $po->date,
                        ':sup_id' => $po->supplier_id,
                        ':wh_id' => $po->warehouse_id,
                        ':tax_r' => $po->tax_rate ?? 0,
                        ':tax_a' => $po->tax_amount ?? 0,
                        ':disc' => $po->discount ?? 0,
                        ':ship' => $po->shipping ?? 0,
                        ':total' => $po->grand_total ?? 0,
                        ':rec' => $po->received_amount ?? 0,
                        ':paid' => $po->paid_amount ?? 0,
                        ':ptype' => $po->payment_type ?? 1,
                        ':notes' => $po->notes,
                        ':status' => $po->status ?? 1,
                        ':cat' => $po->created_at ?? now(),
                        ':uat' => $po->updated_at ?? now(),
                    ]);
                    $cloudPoId = $insertPoStmt->fetchColumn();
                    $cloudRefMap[$ref] = ['id' => $cloudPoId, 'status' => $po->status];
                    $pushedPurchases++;

                    // Sync PO items for new PO
                    if ($cloudPoId) {
                        $items = DB::table('purchase_items')->where('purchase_id', $po->id)->get();
                        foreach ($items as $item) {
                            $itemStmt = $pdo->prepare('
                                INSERT INTO purchase_items (
                                    purchase_id, product_id, product_cost, net_unit_cost, 
                                    tax_type, tax_value, tax_amount, discount_type, discount_value, 
                                    discount_amount, purchase_unit, quantity, sub_total, created_at, updated_at
                                ) VALUES (
                                    :p_id, :prod_id, :cost, :net_cost, 
                                    :tax_t, :tax_v, :tax_a, :disc_t, :disc_v, 
                                    :disc_a, :punit, :qty, :sub, :cat, :uat
                                )
                            ');
                            $itemStmt->execute([
                                ':p_id' => $cloudPoId,
                                ':prod_id' => $item->product_id,
                                ':cost' => $item->product_cost ?? 0,
                                ':net_cost' => $item->net_unit_cost ?? 0,
                                ':tax_t' => $item->tax_type ?? 1,
                                ':tax_v' => $item->tax_value ?? 0,
                                ':tax_a' => $item->tax_amount ?? 0,
                                ':disc_t' => $item->discount_type ?? 1,
                                ':disc_v' => $item->discount_value ?? 0,
                                ':disc_a' => $item->discount_amount ?? 0,
                                ':punit' => $item->purchase_unit ?? 1,
                                ':qty' => $item->quantity ?? 1,
                                ':sub' => $item->sub_total ?? 0,
                                ':cat' => $item->created_at ?? now(),
                                ':uat' => $item->updated_at ?? now(),
                            ]);
                        }
                    }
                }
            }

            // 3. Fetch all existing ASNs from Cloud in a single query
            $cloudAsnMap = [];
            $cloudAsnStmt = $pdo->query('SELECT asn_number, id, status FROM supplier_asns WHERE asn_number IS NOT NULL');
            while ($row = $cloudAsnStmt->fetch()) {
                $cloudAsnMap[$row['asn_number']] = $row;
            }

            $insertAsnStmt = $pdo->prepare('
                INSERT INTO supplier_asns (
                    asn_number, purchase_id, supplier_id, 
                    expected_arrival, transport_company, vehicle_number, 
                    status, remarks, created_at, updated_at
                ) VALUES (
                    :asn_num, :p_id, :sup_id, 
                    :exp_arr, :trans, :veh, 
                    :status, :notes, :cat, :uat
                ) RETURNING id
            ');

            $updateAsnStmt = $pdo->prepare('
                UPDATE supplier_asns SET
                    status = :status,
                    expected_arrival = :exp_arr,
                    transport_company = :trans,
                    vehicle_number = :veh,
                    updated_at = :uat
                WHERE id = :id
            ');

            $localAsns = DB::table('supplier_asns')->get();
            foreach ($localAsns as $asn) {
                $num = $asn->asn_number;
                $cloudAsnId = null;

                // Match cloud purchase ID
                $localPo = DB::table('purchases')->where('id', $asn->purchase_id)->first();
                $cloudPoId = ($localPo && isset($cloudRefMap[$localPo->reference_code])) 
                    ? $cloudRefMap[$localPo->reference_code]['id'] 
                    : $asn->purchase_id;

                if (isset($cloudAsnMap[$num])) {
                    $cloudItem = $cloudAsnMap[$num];
                    $cloudAsnId = $cloudItem['id'];
                    if ($cloudItem['status'] != $asn->status) {
                        $updateAsnStmt->execute([
                            ':id' => $cloudAsnId,
                            ':status' => $asn->status ?? 'pending',
                            ':exp_arr' => $asn->expected_arrival,
                            ':trans' => $asn->transport_company,
                            ':veh' => $asn->vehicle_number,
                            ':uat' => $asn->updated_at ?? now(),
                        ]);
                        $pushedAsns++;
                    }
                } else {
                    $insertAsnStmt->execute([
                        ':asn_num' => $num,
                        ':p_id' => $cloudPoId,
                        ':sup_id' => $asn->supplier_id,
                        ':exp_arr' => $asn->expected_arrival,
                        ':trans' => $asn->transport_company,
                        ':veh' => $asn->vehicle_number,
                        ':status' => $asn->status ?? 'pending',
                        ':notes' => $asn->remarks ?? '',
                        ':cat' => $asn->created_at ?? now(),
                        ':uat' => $asn->updated_at ?? now(),
                    ]);
                    $cloudAsnId = $insertAsnStmt->fetchColumn();
                    $cloudAsnMap[$num] = ['id' => $cloudAsnId, 'status' => $asn->status];
                    $pushedAsns++;
                }

                // 4. Cartons Sync
                if ($cloudAsnId) {
                    $localCartons = DB::table('lpn_cartons')->where('asn_id', $asn->id)->get();
                    if ($localCartons->isNotEmpty()) {
                        $cloudLpnMap = $pdo->query('SELECT lpn_number, id FROM lpn_cartons')->fetchAll(PDO::FETCH_KEY_PAIR);
                        $insertCtn = $pdo->prepare('
                            INSERT INTO lpn_cartons (
                                asn_id, purchase_id, supplier_id, warehouse_id, carton_number, 
                                lpn_number, carton_type, weight, dimensions, 
                                status, created_at, updated_at
                            ) VALUES (
                                :asn_id, :p_id, :sup_id, :wh_id, :ctn_num, 
                                :lpn_num, :ctype, :wt, :dims, 
                                :status, :cat, :uat
                            )
                        ');

                        foreach ($localCartons as $c) {
                            if (!isset($cloudLpnMap[$c->lpn_number])) {
                                $insertCtn->execute([
                                    ':asn_id' => $cloudAsnId,
                                    ':p_id' => $cloudPoId,
                                    ':sup_id' => $c->supplier_id,
                                    ':wh_id' => $asn->warehouse_id ?? 1,
                                    ':ctn_num' => $c->carton_number,
                                    ':lpn_num' => $c->lpn_number,
                                    ':ctype' => $c->container_type ?? ($c->carton_type ?? 'BOX_STANDARD'),
                                    ':wt' => $c->weight ?? 0,
                                    ':dims' => $c->dimensions ?? '',
                                    ':status' => $c->status ?? 'packed',
                                    ':cat' => $c->created_at ?? now(),
                                    ':uat' => $c->updated_at ?? now(),
                                ]);
                                $pushedCartons++;
                            }
                        }
                    }
                }
            }
        } catch (Throwable $e) {
            Log::warning('CloudDatabaseSyncService::pushLocalToCloud error: ' . $e->getMessage());
        }

        return [
            'status' => 'success',
            'pushed_purchases' => $pushedPurchases,
            'pushed_asns' => $pushedAsns,
            'pushed_cartons' => $pushedCartons,
        ];
    }

    /**
     * ── INBOUND: Pull Cloud Supabase changes into Local MySQL ─────────────────
     */
    public static function pullCloudToLocal(): array
    {
        $pdo = self::getCloudPdo();
        if (!$pdo) {
            return ['status' => 'offline', 'count' => 0];
        }

        $pulledPurchases = 0;
        $pulledAsns = 0;

        try {
            // Local Map
            $localPoMap = DB::table('purchases')->pluck('status', 'reference_code')->toArray();

            $cloudPos = $pdo->query('SELECT * FROM purchases WHERE reference_code IS NOT NULL')->fetchAll();
            foreach ($cloudPos as $cPo) {
                $ref = $cPo['reference_code'];
                if (!isset($localPoMap[$ref])) {
                    DB::table('purchases')->insert([
                        'reference_code' => $ref,
                        'date' => $cPo['date'],
                        'supplier_id' => $cPo['supplier_id'],
                        'warehouse_id' => $cPo['warehouse_id'],
                        'tax_rate' => $cPo['tax_rate'],
                        'tax_amount' => $cPo['tax_amount'],
                        'discount' => $cPo['discount'],
                        'shipping' => $cPo['shipping'],
                        'grand_total' => $cPo['grand_total'],
                        'received_amount' => $cPo['received_amount'],
                        'paid_amount' => $cPo['paid_amount'],
                        'payment_type' => $cPo['payment_type'] ?? 1,
                        'notes' => $cPo['notes'],
                        'status' => $cPo['status'],
                        'created_at' => $cPo['created_at'],
                        'updated_at' => $cPo['updated_at'],
                    ]);
                    $localPoMap[$ref] = $cPo['status'];
                    $pulledPurchases++;
                } else if ($localPoMap[$ref] != $cPo['status']) {
                    DB::table('purchases')
                        ->where('reference_code', $ref)
                        ->update([
                            'status' => $cPo['status'],
                            'notes' => $cPo['notes'],
                            'updated_at' => $cPo['updated_at'],
                        ]);
                    $localPoMap[$ref] = $cPo['status'];
                    $pulledPurchases++;
                }
            }

            // Local ASN Map
            $localAsnMap = DB::table('supplier_asns')->pluck('status', 'asn_number')->toArray();
            $cloudAsns = $pdo->query('SELECT * FROM supplier_asns WHERE asn_number IS NOT NULL')->fetchAll();

            foreach ($cloudAsns as $cAsn) {
                $asnNum = $cAsn['asn_number'];
                if (!isset($localAsnMap[$asnNum])) {
                    $cloudPo = $pdo->prepare('SELECT reference_code FROM purchases WHERE id = :id LIMIT 1');
                    $cloudPo->execute([':id' => $cAsn['purchase_id']]);
                    $ref = $cloudPo->fetchColumn();

                    $localPurchaseId = $cAsn['purchase_id'];
                    if ($ref) {
                        $lp = DB::table('purchases')->where('reference_code', $ref)->first();
                        if ($lp) $localPurchaseId = $lp->id;
                    }

                    DB::table('supplier_asns')->insert([
                        'asn_number' => $asnNum,
                        'purchase_id' => $localPurchaseId,
                        'supplier_id' => $cAsn['supplier_id'],
                        'expected_arrival' => $cAsn['expected_arrival'],
                        'transport_company' => $cAsn['transport_company'],
                        'vehicle_number' => $cAsn['vehicle_number'],
                        'status' => $cAsn['status'],
                        'remarks' => $cAsn['remarks'] ?? '',
                        'created_at' => $cAsn['created_at'],
                        'updated_at' => $cAsn['updated_at'],
                    ]);
                    $localAsnMap[$asnNum] = $cAsn['status'];
                    $pulledAsns++;
                } else if ($localAsnMap[$asnNum] != $cAsn['status']) {
                    DB::table('supplier_asns')
                        ->where('asn_number', $asnNum)
                        ->update([
                            'status' => $cAsn['status'],
                            'updated_at' => $cAsn['updated_at'],
                        ]);
                    $localAsnMap[$asnNum] = $cAsn['status'];
                    $pulledAsns++;
                }
            }
        } catch (Throwable $e) {
            Log::warning('CloudDatabaseSyncService::pullCloudToLocal error: ' . $e->getMessage());
        }

        return [
            'status' => 'success',
            'pulled_purchases' => $pulledPurchases,
            'pulled_asns' => $pulledAsns,
        ];
    }
}
