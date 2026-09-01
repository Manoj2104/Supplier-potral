<?php

namespace App\Console\Commands;

use App\Models\Purchase;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;

class SendPoEmailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'send:po-email {purchaseId}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send Purchase Order PDF Email Asynchronously in Background';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $purchaseId = $this->argument('purchaseId');
        Log::info("Background PO Email Command started for Purchase ID: {$purchaseId}");

        try {
            $purchase = Purchase::with(['purchaseItems.product', 'supplier', 'warehouse'])->find($purchaseId);
            if (!$purchase) {
                Log::warning("PO Email Command: Purchase ID {$purchaseId} not found.");
                return 0;
            }

            $supplier = $purchase->supplier;
            $recipientEmail = ($supplier && !empty($supplier->email)) ? $supplier->email : 'manoj8610006544@gmail.com';
            $refCode = $purchase->reference_code ?: ('PO-2026' . str_pad($purchase->id, 5, '0', STR_PAD_LEFT));

            $hostUrl = config('app.public_tunnel_url', 'https://infypos-procurement.loca.lt');
            $approvalUrl = "{$hostUrl}/supplier_action/accept/{$purchase->id}";
            $rejectUrl = "{$hostUrl}/supplier_action/reject/{$purchase->id}";

            // Generate Real Purchase Order PDF Attachment safely
            $pdfOutput = null;
            try {
                $companyLogo = null;
                $logoPath = public_path('images/infyom.png');
                if (file_exists($logoPath)) {
                    $companyLogo = (string) \Image::make($logoPath)->encode('data-url');
                }
                $pdf = \PDF::loadView('pdf.purchase-pdf', compact('purchase', 'companyLogo'))->setOptions([
                    'tempDir' => public_path(),
                    'chroot' => public_path(),
                    'isRemoteEnabled' => false,
                ]);
                $pdfOutput = $pdf->output();
            } catch (\Exception $pdfEx) {
                Log::warning('PDF generation warning in background command: ' . $pdfEx->getMessage());
            }

            Mail::send('emails.enterprise_purchase_order', compact('purchase', 'approvalUrl', 'rejectUrl'), function ($message) use ($recipientEmail, $refCode, $pdfOutput) {
                $message->to($recipientEmail)
                        ->cc('manoj8610006544@gmail.com')
                        ->subject("📦 Purchase Order #{$refCode} Awaiting Your Approval");
                if ($pdfOutput) {
                    $message->attachData($pdfOutput, "{$refCode}.pdf", [
                        'mime' => 'application/pdf',
                    ]);
                }
            });

            Log::info("Background Gmail SMTP Email sent successfully for PO #{$refCode} to {$recipientEmail}");
            return 0;
        } catch (\Exception $ex) {
            Log::error("Background PO Email Error for ID {$purchaseId}: " . $ex->getMessage());
            return 1;
        }
    }
}
