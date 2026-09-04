<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\CreateSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Http\Resources\SupplierCollection;
use App\Http\Resources\SupplierResource;
use App\Imports\SupplierImport;
use App\Models\Purchase;
use App\Repositories\SupplierRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Prettus\Validator\Exceptions\ValidatorException;

/**
 * Class SupplierAPIController
 */
class SupplierAPIController extends AppBaseController
{
    /** @var SupplierRepository */
    private $supplierRepository;

    public function __construct(SupplierRepository $supplierRepository)
    {
        $this->supplierRepository = $supplierRepository;
    }

    public function index(Request $request): SupplierCollection
    {
        $perPage = getPageSize($request);
        $suppliers = $this->supplierRepository->paginate($perPage);
        SupplierResource::usingWithCollection();

        return new SupplierCollection($suppliers);
    }

    /**
     * @throws ValidatorException
     */
    public function store(CreateSupplierRequest $request): SupplierResource
    {
        $input = $request->all();
        $supplier = $this->supplierRepository->create($input);

        // Server-side Online Supabase Synchronization
        \App\Services\SupplierSyncService::syncSupplier($supplier, $request->get('password'));
        $supplier->refresh();

        return new SupplierResource($supplier);
    }

    public function show($id): SupplierResource
    {
        $supplier = $this->supplierRepository->find($id);

        return new SupplierResource($supplier);
    }

    /**
     * @throws ValidatorException
     */
    public function update(UpdateSupplierRequest $request, $id): SupplierResource
    {
        $input = $request->all();
        $supplier = $this->supplierRepository->update($input, $id);

        // Server-side Online Supabase Synchronization
        \App\Services\SupplierSyncService::syncSupplier($supplier);
        $supplier->refresh();

        return new SupplierResource($supplier);
    }

    public function retrySync($id): JsonResponse
    {
        $supplier = $this->supplierRepository->find($id);
        if (!$supplier) {
            return $this->sendError('Supplier not found.');
        }

        $result = \App\Services\SupplierSyncService::syncSupplier($supplier);
        $supplier->refresh();

        if ($result['success']) {
            return $this->sendResponse(new SupplierResource($supplier), 'Supplier synced to Supabase successfully.');
        }

        return $this->sendError('Sync failed: ' . ($result['error'] ?? 'Unknown error'), 422);
    }

    public function destroy($id): JsonResponse
    {
        $purchaseModel = [
            Purchase::class,
        ];
        $useSupplier = canDelete($purchaseModel, 'supplier_id', $id);
        if ($useSupplier) {
            $this->sendError('Supplier can\'t be deleted.');
        }
        $this->supplierRepository->delete($id);

        return $this->sendSuccess('Supplier deleted successfully');
    }

    public function importSuppliers(Request $request): JsonResponse
    {
        Excel::import(new SupplierImport(), request()->file('file'));

        return $this->sendSuccess('Suppliers imported successfully');
    }
}
