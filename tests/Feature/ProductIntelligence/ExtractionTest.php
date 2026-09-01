<?php

namespace Tests\Feature\ProductIntelligence;

use Tests\TestCase;
use App\Services\ProductIntelligence\MarketplaceAdapterRegistry;
use App\Services\ProductIntelligence\VariantIdentityEngine;
use App\Services\ProductIntelligence\BarcodeVerificationEngine;
use App\Services\ProductIntelligence\EvidenceConfidenceEngine;

class ExtractionTest extends TestCase
{
    /** @test */
    public function test_mccain_airfryer_resolves_correctly()
    {
        $res = MarketplaceAdapterRegistry::resolve("https://www.zepto.com/pn/mccain-airfryer-french-fries-crispy-snack/pvid/0143c83b-f2ff-4949-9998-afdcbb272a66");
        $this->assertEquals('McCain', $res['brand']);
        $this->assertEquals('8906000610053', $res['barcode']);
        $this->assertEquals('125.00', $res['price']);
    }

    /** @test */
    public function test_hungritos_returns_clean_null_barcode()
    {
        $res = MarketplaceAdapterRegistry::resolve("https://www.zepto.com/pn/hungritos-french-fries-classic-crispy-snack/pvid/bb123456-7890-abcd-ef01-234567890abc");
        $this->assertEquals('Hungritos', $res['brand']);
        $this->assertNull($res['barcode']);
        $this->assertEquals('UNVERIFIED', $res['barcode_status']);
    }

    /** @test */
    public function test_itc_master_chef_resolves_correct_barcode()
    {
        $res = MarketplaceAdapterRegistry::resolve("https://www.zepto.com/pn/itc-master-chef-crispy-french-fries-no-added-preservatives/pvid/940c943a-a155-4993-82df-9318339cca70");
        $this->assertEquals('ITC Master Chef', $res['brand']);
        $this->assertEquals('8906065169749', $res['barcode']);
        $this->assertEquals('79.00', $res['price']);
    }

    /** @test */
    public function test_zero_brand_cross_contamination()
    {
        $res1 = MarketplaceAdapterRegistry::resolve("https://www.zepto.com/pn/mccain-airfryer-french-fries-crispy-snack/pvid/0143c83b-f2ff-4949-9998-afdcbb272a66");
        $res2 = MarketplaceAdapterRegistry::resolve("https://www.zepto.com/pn/hungritos-french-fries-classic-crispy-snack/pvid/bb123456-7890-abcd-ef01-234567890abc");
        $res3 = MarketplaceAdapterRegistry::resolve("https://www.zepto.com/pn/mccain-airfryer-french-fries-crispy-snack/pvid/0143c83b-f2ff-4949-9998-afdcbb272a66");

        $this->assertEquals('McCain', $res1['brand']);
        $this->assertEquals('Hungritos', $res2['brand']);
        $this->assertEquals('McCain', $res3['brand']);
    }

    /** @test */
    public function test_cost_price_is_never_fabricated()
    {
        $res = MarketplaceAdapterRegistry::resolve("https://www.zepto.com/pn/mccain-airfryer-french-fries-crispy-snack/pvid/0143c83b-f2ff-4949-9998-afdcbb272a66");
        $this->assertNull($res['cost']);
    }

    /** @test */
    public function test_barcode_checksum_validation()
    {
        $valid = BarcodeVerificationEngine::validateChecksum("8906000610053");
        $this->assertTrue($valid['valid']);

        $invalid = BarcodeVerificationEngine::validateChecksum("8906000610059");
        $this->assertFalse($invalid['valid']);
    }
}
