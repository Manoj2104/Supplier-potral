#!/usr/bin/env node
/**
 * INFY-POS Enterprise — ZXing Barcode Decoder with Jimp
 * Version: 12.0
 *
 * Environment: Node.js v24+ with @zxing/library + jimp
 * No canvas, no sharp, no Python required.
 *
 * Input (stdin): JSON { image_url, image_path, timeout_ms? }
 * Output (stdout): JSON candidates array
 *
 * Architecture:
 *   1. Download image via HTTPS (or load from disk)
 *   2. Use jimp to produce pixel buffers in multiple variants
 *   3. Feed each variant into ZXing RGBLuminanceSource → MultiFormatReader
 *   4. Collect all decoded candidates (no first-wins)
 *   5. Emit structured JSON with full evidence
 */

'use strict';

const { MultiFormatReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer, DecodeHintType, BarcodeFormat } = require('@zxing/library');
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

// ─── Capability probe ────────────────────────────────────────────────────────
let Jimp = null;
let jimpAvailable = false;
try {
    Jimp = require('jimp');
    // jimp v0.x: Jimp is the default export. jimp v1.x uses named export.
    if (Jimp && typeof Jimp.read !== 'function' && Jimp.Jimp) {
        Jimp = Jimp.Jimp;
    }
    jimpAvailable = (typeof Jimp.read === 'function');
} catch (e) {
    jimpAvailable = false;
}

// ─── Config ──────────────────────────────────────────────────────────────────
const TIMEOUT_MS = 12000;
const MAX_PIXELS = 3000 * 3000; // skip gigantic images

// ─── Read stdin ───────────────────────────────────────────────────────────────
let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { inputData += chunk; });
process.stdin.on('end', async () => {
    let input = {};
    try {
        input = JSON.parse(inputData);
    } catch (e) {
        emit({ success: false, error: 'INVALID_JSON_INPUT', candidates: [], diagnostics: { decoder_available: false } });
        return;
    }

    const imageUrl  = (input.image_url  || '').trim();
    const imagePath = (input.image_path || '').trim();

    if (!imageUrl && !imagePath) {
        emit({ success: false, error: 'NO_IMAGE_SOURCE', candidates: [], diagnostics: { decoder_available: jimpAvailable } });
        return;
    }

    if (!jimpAvailable) {
        emit({
            success: false,
            error: 'DECODER_UNAVAILABLE',
            message: 'jimp is not installed. Run: npm install jimp',
            candidates: [],
            diagnostics: { decoder_available: false, jimp_available: false, zxing_available: true }
        });
        return;
    }

    try {
        // Step 1: acquire image buffer
        let imgBuffer = null;
        if (imagePath && fs.existsSync(imagePath)) {
            imgBuffer = fs.readFileSync(imagePath);
        } else if (imageUrl) {
            imgBuffer = await downloadImage(imageUrl, TIMEOUT_MS);
        }

        if (!imgBuffer || imgBuffer.length < 100) {
            emit({ success: false, error: 'IMAGE_DOWNLOAD_FAILED', candidates: [], diagnostics: { decoder_available: true } });
            return;
        }

        // Step 2: load with jimp
        let jimpImg = null;
        try {
            jimpImg = await Jimp.read(imgBuffer);
        } catch (e) {
            emit({ success: false, error: 'IMAGE_PARSE_FAILED', message: e.message, candidates: [], diagnostics: { decoder_available: true } });
            return;
        }

        const origW = jimpImg.getWidth ? jimpImg.getWidth() : jimpImg.bitmap.width;
        const origH = jimpImg.getHeight ? jimpImg.getHeight() : jimpImg.bitmap.height;

        if (origW * origH > MAX_PIXELS) {
            emit({ success: false, error: 'IMAGE_TOO_LARGE', candidates: [], diagnostics: { width: origW, height: origH } });
            return;
        }

        // Step 3: generate variants
        const variants = await generateVariants(jimpImg, origW, origH);

        // Step 4: decode each variant
        const allCandidates = [];
        const seenGtins = new Set();

        for (const variant of variants) {
            const decoded = decodeWithZXing(variant.data, variant.width, variant.height);
            if (decoded && decoded.text) {
                const gtin = normalizeGtin(decoded.text);
                const key  = `${gtin}:${decoded.format}`;
                const candidate = {
                    gtin:               gtin,
                    raw_text:           decoded.text,
                    symbology:          decoded.format,
                    variant_id:         variant.id,
                    variant_desc:       variant.desc,
                    checksum_valid:     validateChecksum(gtin),
                    physical_detection: true,
                    decoder:            'ZXing + jimp',
                    decoder_confidence: estimateDecoderConfidence(decoded, variant),
                };
                if (!seenGtins.has(key)) {
                    seenGtins.add(key);
                    allCandidates.push(candidate);
                } else {
                    // existing candidate: increment confirmation count
                    const existing = allCandidates.find(c => `${c.gtin}:${c.symbology}` === key);
                    if (existing) existing.confirmation_count = (existing.confirmation_count || 1) + 1;
                }
            }
        }

        // Step 5: rank candidates
        allCandidates.sort((a, b) => {
            // checksum valid first, then by confirmation count, then by decoder confidence
            const cs = (b.checksum_valid ? 1 : 0) - (a.checksum_valid ? 1 : 0);
            if (cs !== 0) return cs;
            const cc = (b.confirmation_count || 1) - (a.confirmation_count || 1);
            if (cc !== 0) return cc;
            return b.decoder_confidence - a.decoder_confidence;
        });

        emit({
            success:    allCandidates.length > 0,
            candidates: allCandidates,
            variant_count: variants.length,
            image_dimensions: { width: origW, height: origH },
            diagnostics: {
                decoder_available: true,
                jimp_available:    true,
                zxing_available:   true,
                variants_tried:    variants.length,
                candidates_found:  allCandidates.length,
            }
        });
    } catch (e) {
        emit({
            success: false,
            error:   'UNEXPECTED_ERROR',
            message: e.message,
            candidates: [],
            diagnostics: { decoder_available: jimpAvailable }
        });
    }
});

// ─── Variant Generation ───────────────────────────────────────────────────────
async function generateVariants(jimpImg, w, h) {
    const variants = [];
    const getPixels = (img) => {
        const bm = img.bitmap;
        const data = bm.data; // RGBA Buffer
        const pixels = new Uint8ClampedArray(bm.width * bm.height * 3);
        for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
            pixels[j]   = data[i];
            pixels[j+1] = data[i+1];
            pixels[j+2] = data[i+2];
        }
        return { data: pixels, width: bm.width, height: bm.height };
    };

    const clone = () => jimpImg.clone();

    // Helper: add variant safely
    const addVariant = async (id, desc, imgModFn) => {
        try {
            const img = clone();
            await imgModFn(img);
            const p = getPixels(img);
            variants.push({ id, desc, ...p });
        } catch (e) { /* skip failed variants */ }
    };

    // Original
    {
        const p = getPixels(jimpImg);
        variants.push({ id: 'original', desc: 'Original RGB', ...p });
    }

    // Greyscale
    await addVariant('grey', 'Greyscale', img => img.greyscale());

    // Contrast enhanced
    await addVariant('contrast', 'Contrast +0.5', img => img.contrast(0.5));

    // High contrast + greyscale
    await addVariant('hi_contrast_grey', 'Greyscale + contrast 0.7', img => img.greyscale().contrast(0.7));

    // Inverted
    await addVariant('inverted', 'Inverted', img => img.invert());

    // Inverted greyscale
    await addVariant('inv_grey', 'Inverted greyscale', img => img.greyscale().invert());

    // 2x upscale (helps small images)
    if (w < 800) {
        await addVariant('upscale_2x', 'Upscale 2x', img => img.scale(2));
        await addVariant('upscale_2x_grey', 'Upscale 2x greyscale', img => img.scale(2).greyscale());
        await addVariant('upscale_2x_contrast', 'Upscale 2x contrast', img => img.scale(2).greyscale().contrast(0.5));
    }

    // 4x upscale for very small images
    if (w < 400) {
        await addVariant('upscale_4x', 'Upscale 4x', img => img.scale(4));
        await addVariant('upscale_4x_grey', 'Upscale 4x greyscale', img => img.scale(4).greyscale());
    }

    // Region crops — barcode typically lives in lower 40% or upper 40%
    const regions = [
        { id: 'bottom_half',  desc: 'Bottom 50%',  y: Math.floor(h * 0.5),  ch: Math.floor(h * 0.5) },
        { id: 'top_half',     desc: 'Top 50%',     y: 0,                     ch: Math.floor(h * 0.5) },
        { id: 'bottom_third', desc: 'Bottom 33%',  y: Math.floor(h * 0.66), ch: Math.floor(h * 0.34) },
        { id: 'top_third',    desc: 'Top 33%',     y: 0,                     ch: Math.floor(h * 0.33) },
        { id: 'right_half',   desc: 'Right 50%',   x: Math.floor(w * 0.5),  cw: Math.floor(w * 0.5) },
        { id: 'left_half',    desc: 'Left 50%',    x: 0,                     cw: Math.floor(w * 0.5) },
    ];
    for (const r of regions) {
        await addVariant(r.id, r.desc, img => img.crop(
            r.x || 0, r.y || 0,
            r.cw || w, r.ch || h
        ));
        await addVariant(r.id + '_grey', r.desc + ' grey', img => img.crop(
            r.x || 0, r.y || 0,
            r.cw || w, r.ch || h
        ).greyscale());
        await addVariant(r.id + '_hi_contrast', r.desc + ' hi-contrast', img => img.crop(
            r.x || 0, r.y || 0,
            r.cw || w, r.ch || h
        ).greyscale().contrast(0.7));
    }

    // Rotations (handles sideways packaging)
    await addVariant('rot90',      'Rotated 90°',  img => img.rotate(90));
    await addVariant('rot180',     'Rotated 180°', img => img.rotate(180));
    await addVariant('rot270',     'Rotated 270°', img => img.rotate(270));
    await addVariant('rot90_grey', 'Rotated 90° grey', img => img.rotate(90).greyscale());

    return variants;
}

// ─── ZXing decode ─────────────────────────────────────────────────────────────
function decodeWithZXing(rgbData, width, height) {
    try {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128,
            BarcodeFormat.ITF,
            BarcodeFormat.CODE_39,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.PURE_BARCODE, false);

        const lumSrc = new RGBLuminanceSource(rgbData, width, height);
        const bitmap = new BinaryBitmap(new HybridBinarizer(lumSrc));
        const reader = new MultiFormatReader();
        reader.setHints(hints);
        const result = reader.decode(bitmap);
        if (result) {
            return {
                text:   result.getText(),
                format: result.getBarcodeFormat ? result.getBarcodeFormat().toString() : 'UNKNOWN',
            };
        }
    } catch (e) {
        // NotFoundException etc — normal for most variants
    }
    return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeGtin(text) {
    return (text || '').replace(/[^0-9]/g, '');
}

function validateChecksum(gtin) {
    const digits = (gtin || '').replace(/\D/g, '');
    if (digits.length < 8) return false;
    const padded = digits.padStart(14, '0');
    let sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(padded[i]) * (i % 2 === 0 ? 3 : 1);
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(padded[13]);
}

function estimateDecoderConfidence(decoded, variant) {
    // Higher confidence for:
    // 1. EAN/UPC formats (most reliable for FMCG)
    // 2. Original or grey variants (not heavily processed)
    let score = 0.7;
    const fmt = (decoded.format || '').toUpperCase();
    if (fmt.includes('EAN_13') || fmt.includes('EAN13')) score += 0.15;
    else if (fmt.includes('UPC_A') || fmt.includes('UPCA')) score += 0.1;
    else if (fmt.includes('EAN_8') || fmt.includes('EAN8')) score += 0.1;
    if (variant.id === 'original' || variant.id === 'grey') score += 0.1;
    if (variant.id.includes('upscale')) score -= 0.05;
    return Math.min(0.99, Math.round(score * 100) / 100);
}

function downloadImage(url, timeoutMs) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        const chunks = [];
        const req = proto.get(url, {
            headers: {
                'User-Agent': 'INFY-POS/12.0 BarcodeDecoder',
                'Accept': 'image/webp,image/jpeg,image/png,image/*',
            },
            timeout: timeoutMs,
        }, res => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // Follow redirect
                downloadImage(res.headers.location, timeoutMs).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error('HTTP ' + res.statusCode));
                return;
            }
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
        req.on('error', reject);
    });
}

function emit(obj) {
    process.stdout.write(JSON.stringify(obj) + '\n');
}
