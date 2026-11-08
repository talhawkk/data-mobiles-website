import asyncio
import json
import os
import sys
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

CHECKPOINTS = [0.0, 0.12, 0.23, 0.30, 0.44, 0.52, 0.62, 0.72, 0.84, 0.97]
TARGET_MEAN = 22.0
TARGET_PCT_60 = 6.0

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

async def measure(label="Current"):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH if os.path.exists(CHROME_PATH) else None,
            headless=True,
            args=['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle']
        )
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()
        page.on('console', lambda msg: print(f"[BROWSER {msg.type.upper()}] {msg.text}") if msg.type in ['error', 'warning'] else None)
        
        await page.goto('http://127.0.0.1:3000/?tier=0', wait_until='networkidle')
        await page.wait_for_timeout(2500) # Preloader finish
        
        results = []
        os.makedirs('tmp_measure', exist_ok=True)
        
        for cp in CHECKPOINTS:
            await page.evaluate(f'window.__seek && window.__seek({cp})')
            await page.wait_for_timeout(350)
            
            shot_path = f'tmp_measure/shot_{cp:.2f}.png'
            await page.screenshot(path=shot_path)
            
            # Analyze screenshot
            im = Image.open(shot_path)
            w, h = im.size
            # Right 55% of the viewport (x from 0.45*w to w)
            right_crop = im.crop((int(w * 0.45), 0, w, h))
            arr = np.array(right_crop, dtype=np.float32)
            # Luminance: standard Rec. 601 luma: 0.299 R + 0.587 G + 0.114 B
            luma = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
            
            mean_luma = float(np.mean(luma))
            pct_gt_60 = float(np.sum(luma > 60.0) / luma.size * 100.0)
            
            passed = (mean_luma >= TARGET_MEAN) and (pct_gt_60 >= TARGET_PCT_60)
            results.append({
                'progress': cp,
                'mean_luma': round(mean_luma, 2),
                'pct_gt_60': round(pct_gt_60, 2),
                'pass': passed
            })
            
        await browser.close()
        
        print(f"\n=== Visibility Measurement: {label} ===")
        print(f"{'Progress':<10} | {'Mean Luma (>=22)':<18} | {'% > 60 (>=6.0%)':<18} | {'Status':<8}")
        print("-" * 62)
        all_passed = True
        for r in results:
            status = "PASS" if r['pass'] else "FAIL"
            if not r['pass']:
                all_passed = False
            print(f"{r['progress']:<10.2f} | {r['mean_luma']:<18.2f} | {r['pct_gt_60']:<18.2f} | {status:<8}")
        print("-" * 62)
        print(f"Overall Result: {'ALL PASS' if all_passed else 'FAILS FOUND'}\n")
        return results

if __name__ == '__main__':
    label = sys.argv[1] if len(sys.argv) > 1 else "Baseline"
    asyncio.run(measure(label))
