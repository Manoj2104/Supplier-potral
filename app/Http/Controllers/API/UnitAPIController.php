<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\CreateUnitRequest;
use App\Http\Requests\UpdateUnitRequest;
use App\Http\Resources\UnitCollection;
use App\Http\Resources\UnitResource;
use App\Repositories\UnitRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Prettus\Validator\Exceptions\ValidatorException;

/**
 * Class UnitAPIController
 */
class UnitAPIController extends AppBaseController
{
    /**
     * @var UnitRepository
     */
    private $unitRepository;

    public function __construct(UnitRepository $unitRepository)
    {
        $this->unitRepository = $unitRepository;
    }

    public function index(Request $request): UnitCollection
    {
        $perPage = getPageSize($request);
        $query = \App\Models\Unit::with(['baseUnit']);

        if ($request->get('base_unit')) {
            $query->where('base_unit', $request->get('base_unit'));
        }

        $search = $request->filter['search'] ?? ($request->get('search') ?? '');
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%$search%")
                  ->orWhere('short_name', 'LIKE', "%$search%");
            });
        }

        $units = $perPage > 0 ? $query->paginate($perPage) : $query->paginate(100);

        UnitResource::usingWithCollection();

        return new UnitCollection($units);
    }

    /**
     * @throws ValidatorException
     */
    public function store(CreateUnitRequest $request): UnitResource
    {
        $input = $request->all();
        $unit = $this->unitRepository->create($input);

        return new UnitResource($unit);
    }

    public function show($id): UnitResource
    {
        $unit = $this->unitRepository->find($id);

        return new UnitResource($unit);
    }

    /**
     * @throws ValidatorException
     */
    public function update(UpdateUnitRequest $request, $id): UnitResource
    {
        $input = $request->all();
        $unit = $this->unitRepository->update($input, $id);

        return new UnitResource($unit);
    }

    public function destroy($id): JsonResponse
    {
        $unitUse = $this->unitRepository->unitCantDelete($id);
        if ($unitUse) {
            return $this->sendError('Unit can\'t be deleted.');
        }

        $this->unitRepository->delete($id);

        return $this->sendSuccess('Unit deleted successfully');
    }
}
