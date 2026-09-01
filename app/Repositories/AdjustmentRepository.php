<?php

namespace App\Repositories;

use App\Models\Adjustment;
use App\Models\AdjustmentItem;
use App\Models\ManageStock;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Class SaleRepository
 */
class AdjustmentRepository extends BaseRepository
{
    /**
     * @var array
     */
    protected $fieldSearchable = [
        'date',
        'reference_code',
        'warehouse_id',
        'total_products',
        'created_at',
    ];

    /**
     * @var string[]
     */
    protected $allowedFields = [
        'date',
    ];

    /**
     * Return searchable fields
     */
    public function getFieldsSearchable(): array
    {
        return $this->fieldSearchable;
    }

    /**
     * Configure the Model
     **/
    public function model(): string
    {
        return Adjustment::class;
    }

    public function storeAdjustment($input): Adjustment
    {
        try {
            DB::beginTransaction();

            $input['total_products'] = count($input['adjustment_items']);
            $input['date'] = $input['date'] ?? date('Y/m/d');
            $input['created_by'] = auth()->id() ?: 1;
            $input['reason'] = $input['reason'] ?? null;
            $adjustmentInputArray = Arr::only($input, [
                'date', 'warehouse_id', 'total_products', 'created_by', 'reason',
            ]);
            $adjustment = Adjustment::create($adjustmentInputArray);
            $reference_code = 'AD_111'.$adjustment->id;
            $adjustment->update(['reference_code' => $reference_code]);

            $adjustment = $this->storeAdjustmentItems($adjustment, $input);

            DB::commit();

            return $adjustment;
        } catch (Exception $e) {
            DB::rollBack();
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }

    public static function syncBinInventoryForAdjustment($productId, $quantity, $methodType, $warehouseId = null)
    {
        $quantity = (float) $quantity;
        $warehouse = \App\Models\Warehouse::first();
        $whId = $warehouseId ?: ($warehouse ? $warehouse->id : 1);

        // 1. Direct and robust update to ManageStock
        $manageStock = ManageStock::firstOrCreate(
            ['product_id' => $productId, 'warehouse_id' => $whId],
            ['quantity' => 0]
        );

        $isAddition = ($methodType == 1 || $methodType == '1' || $methodType == 'Addition' || $methodType == AdjustmentItem::METHOD_ADDITION);

        if ($isAddition) {
            $manageStock->increment('quantity', $quantity);
        } else {
            $newQty = max(0, ((float) $manageStock->quantity) - $quantity);
            $manageStock->update(['quantity' => $newQty]);
        }

        // 2. Also keep bin_inventories updated for warehouse management
        if (DB::getSchemaBuilder()->hasTable('bin_inventories')) {
            if ($isAddition) {
                $binInv = DB::table('bin_inventories')->where('product_id', $productId)->first();
                if ($binInv) {
                    DB::table('bin_inventories')->where('id', $binInv->id)->increment('quantity', $quantity);
                } else {
                    DB::table('bin_inventories')->insert([
                        'bin_code' => 'A-01-01',
                        'product_id' => $productId,
                        'quantity' => $quantity,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            } else {
                $remainingToDeduct = $quantity;
                $binInvs = DB::table('bin_inventories')->where('product_id', $productId)->orderByDesc('quantity')->get();
                foreach ($binInvs as $binInv) {
                    if ($remainingToDeduct <= 0) break;
                    $currentQty = (float) $binInv->quantity;
                    if ($currentQty >= $remainingToDeduct) {
                        DB::table('bin_inventories')->where('id', $binInv->id)->update(['quantity' => $currentQty - $remainingToDeduct]);
                        $remainingToDeduct = 0;
                    } else {
                        DB::table('bin_inventories')->where('id', $binInv->id)->update(['quantity' => 0]);
                        $remainingToDeduct -= $currentQty;
                    }
                }
            }
        }
    }

    public function storeAdjustmentItems($adjustment, $input)
    {
        foreach ($input['adjustment_items'] as $adjustmentItem) {
            $adjustmentItem['adjustment_id'] = $adjustment->id;
            AdjustmentItem::Create($adjustmentItem);

            self::syncBinInventoryForAdjustment(
                $adjustmentItem['product_id'],
                $adjustmentItem['quantity'],
                $adjustmentItem['method_type'],
                $adjustment->warehouse_id
            );
        }

        return $adjustment;
    }

    public function updateAdjustment($input, $id)
    {
        try {
            DB::beginTransaction();

            $adjustment = Adjustment::findOrFail($id);

            $input['total_products'] = count($input['adjustment_items']);
            $input['date'] = $input['date'] ?? date('Y/m/d');
            if (isset($input['reason'])) {
                $input['reason'] = $input['reason'];
            }
            $adjustmentInputArray = Arr::only($input, [
                'date', 'warehouse_id', 'total_products', 'reason',
            ]);
            $adjustment->update($adjustmentInputArray);

            $adjustment = $this->updateAdjustmentItems($adjustment, $input);

            DB::commit();

            return $adjustment;
        } catch (Exception $e) {
            DB::rollBack();
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }

    public function updateAdjustmentItems($adjustment, $input)
    {
        $adjustmentItmOldIds = AdjustmentItem::whereAdjustmentId($adjustment->id)->pluck('id')->toArray();
        $adjustmentItemIds = [];

        foreach ($input['adjustment_items'] as $key => $adjustmentItem) {
            $adjustmentItemIds[$key] = $adjustmentItem['adjustment_item_id'];

            if (is_null($adjustmentItem['adjustment_item_id'])) {
                $adjustmentItem['adjustment_id'] = $adjustment->id;
                AdjustmentItem::Create($adjustmentItem);

                self::syncBinInventoryForAdjustment(
                    $adjustmentItem['product_id'],
                    $adjustmentItem['quantity'],
                    $adjustmentItem['method_type'],
                    $adjustment->warehouse_id
                );
            } else {
                $exitAdjustmentItem = AdjustmentItem::whereId($adjustmentItem['adjustment_item_id'])->firstOrFail();

                // Reverse previous adjustment effect first
                $reverseOldMethod = ($exitAdjustmentItem->method_type == AdjustmentItem::METHOD_ADDITION) 
                    ? AdjustmentItem::METHOD_SUBTRACTION 
                    : AdjustmentItem::METHOD_ADDITION;

                self::syncBinInventoryForAdjustment(
                    $exitAdjustmentItem->product_id,
                    $exitAdjustmentItem->quantity,
                    $reverseOldMethod,
                    $adjustment->warehouse_id
                );

                // Apply new adjustment effect
                self::syncBinInventoryForAdjustment(
                    $adjustmentItem['product_id'],
                    $adjustmentItem['quantity'],
                    $adjustmentItem['method_type'],
                    $adjustment->warehouse_id
                );

                $exitAdjustmentItem->update([
                    'quantity' => $adjustmentItem['quantity'],
                    'method_type' => $adjustmentItem['method_type'],
                ]);
            }
        }

        $removeItemIds = array_diff($adjustmentItmOldIds, $adjustmentItemIds);

        if (! empty(array_values($removeItemIds))) {
            foreach ($removeItemIds as $removeItemId) {
                $oldItem = AdjustmentItem::whereId($removeItemId)->firstOrFail();
                
                // Reverse old item effect
                $reverseOldMethod = ($oldItem->method_type == AdjustmentItem::METHOD_ADDITION) 
                    ? AdjustmentItem::METHOD_SUBTRACTION 
                    : AdjustmentItem::METHOD_ADDITION;

                self::syncBinInventoryForAdjustment(
                    $oldItem->product_id,
                    $oldItem->quantity,
                    $reverseOldMethod,
                    $adjustment->warehouse_id
                );
            }
            AdjustmentItem::whereIn('id', array_values($removeItemIds))->delete();
        }

        return $adjustment;
    }
}
