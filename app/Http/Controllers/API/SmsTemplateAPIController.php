<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\SmsTemplateUpdateRequest;
use App\Http\Resources\SmsTemplateCollection;
use App\Http\Resources\SmsTemplateResource;
use App\Models\SmsTemplate;
use App\Repositories\SmsTemplateRepository;
use Illuminate\Http\Request;

class SmsTemplateAPIController extends AppBaseController
{
    /** @var SmsTemplateRepository */
    private $smsTemplateRepository;

    public function __construct(SmsTemplateRepository $smsTemplateRepository)
    {
        $this->smsTemplateRepository = $smsTemplateRepository;
    }

    public function index(Request $request): SmsTemplateCollection
    {
        $perPage = getPageSize($request);

        $smsTemplates = $this->smsTemplateRepository;

        $smsTemplates = $smsTemplates->paginate($perPage);

        SmsTemplateResource::usingWithCollection();

        return new SmsTemplateCollection($smsTemplates);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request): SmsTemplateResource
    {
        $input = $request->all();
        $smsTemplate = SmsTemplate::create([
            'template_name' => $input['name'] ?? ($input['template_name'] ?? 'Custom SMS Template'),
            'content'       => $input['content'] ?? '',
            'type'          => $input['type'] ?? 3,
            'status'        => 1,
        ]);

        return new SmsTemplateResource($smsTemplate);
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function show(int $id)
    {
        $smsTemplate = SmsTemplate::findOrFail($id);
        return new SmsTemplateResource($smsTemplate);
    }

    public function edit(SmsTemplate $smsTemplate): SmsTemplateResource
    {
        return new SmsTemplateResource($smsTemplate);
    }

    public function update(SmsTemplateUpdateRequest $request, $id): SmsTemplateResource
    {
        $input = $request->all();

        $smsTemplate = $this->smsTemplateRepository->updateSmsTemplate($input, $id);

        return new SmsTemplateResource($smsTemplate);
    }

    public function changeActiveStatus($id): SmsTemplateResource
    {
        $smsTemplate = SmsTemplate::findOrFail($id);
        $status = ! $smsTemplate->status;
        $smsTemplate->update(['status' => $status]);

        return new SmsTemplateResource($smsTemplate);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return \Illuminate\Http\Response
     */
    public function destroy(int $id)
    {
        $smsTemplate = SmsTemplate::findOrFail($id);
        $smsTemplate->delete();

        return $this->sendSuccess('SMS Template deleted successfully');
    }
}
