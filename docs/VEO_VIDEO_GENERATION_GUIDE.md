# ThreatMatrix AI — Veo Video Generation Guide (A+ Grade)

> **Purpose**: Complete step-by-step guide for generating all 7 cinematic video backgrounds using the **Image-to-Video** workflow. You generate a precise Start Frame and End Frame image first, then feed the Start Frame into Google Veo 2 with a motion prompt. This gives you 10x more control over composition, color, and quality.

---

## Table of Contents

1. [The Cinematic Flow — Narrative Architecture](#1-the-cinematic-flow--narrative-architecture)
2. [How to Access the Tools](#2-how-to-access-the-tools)
3. [Master Style Framework](#3-master-style-framework)
4. [The 7 Sections — Image + Video Prompts](#4-the-7-sections--image--video-prompts)
5. [Step-by-Step Manual Workflow](#5-step-by-step-manual-workflow)
6. [Post-Production with ffmpeg](#6-post-production-with-ffmpeg)
7. [Creating Poster Frames](#7-creating-poster-frames)
8. [File Placement Checklist](#8-file-placement-checklist)
9. [Troubleshooting & Pro Tips](#9-troubleshooting--pro-tips)

---

## 1. The Cinematic Flow — Narrative Architecture

The About page tells a **single story** through scroll. Each section flows into the next like chapters. The user is the camera operator — scrolling is advancing the narrative.

```
SCROLL START
    │
    ▼
┌─ V1 HERO ──────────────────────────────────────────┐
│  "You enter the system"                             │
│  MOTION: Camera flies FORWARD into a data tunnel    │
│  EMOTION: Awe, arrival, scale                       │
│  COLOR: Pure cyan on black                          │
│  TRANSITION → tunnel opens into dark space...       │
└────────────────────────────────────────────────┬─────┘
                                                 │
┌─ V2 PROBLEM ──────────────────────────────────┴─────┐
│  "You see the threat landscape"                      │
│  MOTION: Camera ORBITS slowly around a globe         │
│  EMOTION: Tension, danger, global scale              │
│  COLOR: Red threats pulse on dark globe + cyan grid  │
│  TRANSITION → camera pulls away from globe into...   │
└────────────────────────────────────────────────┬─────┘
                                                 │
┌─ V3 ARCHITECTURE ─────────────────────────────┴─────┐
│  "You see how ThreatMatrix is built"                 │
│  MOTION: Camera TILTS UP through 3 glass layers      │
│  EMOTION: Clarity, engineering elegance              │
│  COLOR: Orange → Cyan → Purple (3 tiers)             │
│  TRANSITION → camera rises past top layer into...    │
└────────────────────────────────────────────────┬─────┘
                                                 │
┌─ V4 ML MODELS ────────────────────────────────┴─────┐
│  "You dive into the intelligence"                    │
│  MOTION: Camera ZOOMS IN to neural network           │
│  EMOTION: Precision, depth, scientific beauty        │
│  COLOR: Cyan + purple neural glow                    │
│  TRANSITION → zooms so deep it becomes abstract...   │
└────────────────────────────────────────────────┬─────┘
                                                 │
┌─ V5 COMPETITIVE ──────────────────────────────┴─────┐
│  "You see the disruption"                            │
│  MOTION: Camera DOLLIES LEFT→RIGHT (old→new)         │
│  EMOTION: Contrast, transformation, confidence       │
│  COLOR: Dim red (old) → Bright cyan (new)            │
│  TRANSITION → the new side glows brighter into...    │
└────────────────────────────────────────────────┬─────┘
                                                 │
┌─ V6 TECH STACK ───────────────────────────────┴─────┐
│  "You see the ecosystem"                             │
│  MOTION: Camera ORBITS around a technology core      │
│  EMOTION: Power, completeness, polish                │
│  COLOR: Cyan icons orbit obsidian core               │
│  TRANSITION → orbit slows, camera drifts toward...   │
└────────────────────────────────────────────────┬─────┘
                                                 │
┌─ V7 CTA PORTAL ──────────────────────────────┴─────┐
│  "You're invited inside"                             │
│  MOTION: Camera pushes FORWARD through opening door  │
│  EMOTION: Invitation, anticipation, arrival          │
│  COLOR: Cyan light floods through opening iris       │
│  END → light fills the frame = "Enter War Room"      │
└─────────────────────────────────────────────────────┘
    │
    ▼
SCROLL END → CTA BUTTON → /login
```

**Key Design Principle**: Every section's camera moves in ONE direction and the end state visually flows into the start of the next.

---

## 2. How to Access the Tools

### Image Generation (Start/End Frames)

You need to generate 2 images per section (14 total): the **Start Frame** (first frame of the video) and the **End Frame** (for your own reference — what the video should look like at scroll 100%).

| Tool | How to Use | Best For |
|------|-----------|----------|
| **Google AI Studio (Gemini)** | [aistudio.google.com](https://aistudio.google.com/) → "Create Image" → Gemini model | Best option — same ecosystem as Veo |
| **Google ImageFX** | [aitestkitchen.withgoogle.com/tools/image-fx](https://aitestkitchen.withgoogle.com/tools/image-fx) | Free, quick, excellent quality |
| **Midjourney** | [midjourney.com](https://midjourney.com) → `/imagine` command in Discord | Best overall image quality |
| **Leonardo AI** | [leonardo.ai](https://leonardo.ai) | Free tier, great for sci-fi |

> **Recommended**: Use **Google AI Studio (Gemini)** for both images and video — the style consistency between Imagen and Veo is unmatched because they share training data.

### Video Generation (Image-to-Video)

| Tool | How to Use | Best For |
|------|-----------|----------|
| **OpenRouter API** | `POST /api/alpha/videos` with `image_url` + motion prompt | **Recommended** — scriptable, Veo 3.1 + other models |
| **Google AI Studio → Veo 2** | Upload Start Frame → Write motion prompt → Generate | Manual UI, free tier |
| **Google Flow** | [aistudio.google.com](https://aistudio.google.com/) → Guided Image-to-Video | Most visual control |

---

### Option A: OpenRouter API (Recommended — Scriptable)

OpenRouter provides a unified API gateway to access **Google Veo 3.1** and other video models. Best option because you can script it, batch-generate all 7 clips, and swap models without changing workflow.

#### Step 1: Get Your API Key

1. Go to **[openrouter.ai](https://openrouter.ai/)** → Sign up / Sign in
2. Navigate to **Settings → API Keys**
3. Click **"Create Key"** → Copy and save it
4. Add credits (Settings → Billing)

#### Step 2: Text-to-Video (Basic)

```bash
curl -X POST "https://openrouter.ai/api/alpha/videos" \
  -H "Authorization: Bearer YOUR_OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/veo-3.1",
    "prompt": "The camera glides forward on a motorized dolly through a corridor of hexagonal brushed aluminum panels with cyan LED edge-strips. Haze drifts through volumetric light beams. Constant velocity forward. Arri Alexa 65, anamorphic lens. Hyperrealistic.",
    "aspect_ratio": "16:9"
  }'
```

Response returns a **job ID** and **polling URL**:
```json
{
  "id": "vid_abc123",
  "polling_url": "https://openrouter.ai/api/alpha/videos/vid_abc123",
  "status": "pending"
}
```

#### Step 3: Poll for Completion

```bash
curl -X GET "https://openrouter.ai/api/alpha/videos/vid_abc123" \
  -H "Authorization: Bearer YOUR_OPENROUTER_API_KEY"
```

When `status` is `"completed"`, download from `unsigned_urls`:
```json
{
  "id": "vid_abc123",
  "status": "completed",
  "unsigned_urls": ["https://storage.googleapis.com/...hero_v1.mp4"]
}
```

#### Step 4: Image-to-Video (The Power Move)

Include `image_url` to use your Start Frame:

**Public URL:**
```bash
curl -X POST "https://openrouter.ai/api/alpha/videos" \
  -H "Authorization: Bearer YOUR_OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/veo-3.1",
    "prompt": "The camera glides forward through the corridor at steady constant speed. Cyan LED edge-strips create light streaks. Haze drifts through light beams. Hyperrealistic, Arri Alexa 65.",
    "image_url": "https://your-host.com/hero_start.png",
    "aspect_ratio": "16:9"
  }'
```

**Base64 Data URL (local file, no hosting):**
```powershell
# Convert local image to base64 in PowerShell
$imageBytes = [System.IO.File]::ReadAllBytes("C:\path\to\hero_start.png")
$base64 = [System.Convert]::ToBase64String($imageBytes)
$dataUrl = "data:image/png;base64,$base64"
# Use $dataUrl as the image_url value in curl
```

#### Available Video Models on OpenRouter

| Model ID | Provider | Notes |
|----------|----------|-------|
| `google/veo-3.1` | Google DeepMind | **Best for ThreatMatrix** — highest realism |
| `minimax/video-01` | MiniMax | Fast generation, good motion |
| `kling-ai/kling-v2` | Kling | Smooth camera movements |
| `wan-ai/wan-2.6` | Wan AI | Alternative option |

> Check [openrouter.ai/models](https://openrouter.ai/models) for current models and pricing.

#### PowerShell Batch Script — Generate All 7 Videos

Save as `generate_videos.ps1` in your project root:

```powershell
# generate_videos.ps1 — Batch generate all ThreatMatrix About videos
# Usage: .\generate_videos.ps1 -ApiKey "sk-or-v1-your-key"

param(
    [Parameter(Mandatory=$true)][string]$ApiKey,
    [string]$Model = "google/veo-3.1",
    [string]$OutputDir = "frontend\public\videos\about"
)

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type"  = "application/json"
}

$videos = @(
    @{ Name = "hero";         Prompt = "Camera glides forward on motorized dolly through corridor. Brushed aluminum hexagonal panels pass by. Cyan LED edge-strips create light streaks. Haze drifts through light beams. Never stops, never accelerates. Cinematic, Arri Alexa 65, anamorphic lens, hyperrealistic." },
    @{ Name = "problem";      Prompt = "Camera on motorized circular track orbits slowly around glass globe left to right at steady constant speed. Red fiber-optic pinpoints pulse. Projected red laser arcs shimmer in haze. Cyan spotlight shifts across frosted glass. Constant distance, no zoom. Cinematic, Arri Alexa 65, hyperrealistic." },
    @{ Name = "architecture"; Prompt = "Camera rises smoothly upward on motorized jib at steady constant speed. Starts at bottom orange-lit acrylic shelf, rises past middle cyan shelf to top purple shelf. Dust motes drift upward. Each shelf passes at equal intervals. Cinematic, Arri Alexa 65, hyperrealistic." },
    @{ Name = "ml-models";    Prompt = "Camera on macro dolly advances slowly into center of fiber optic bundle. Outer strands defocus. Central junction grows larger. Individual fibers become thick glowing threads. Perfectly linear zoom-in. Shallow DOF. Cinematic, Arri Alexa 65, anamorphic macro lens, hyperrealistic." },
    @{ Name = "competitive";  Prompt = "Camera dollies horizontally on slider left to right at steady speed. Old server rack slides out left. Light transitions warm amber to cool cyan. Sleek black device grows larger on right. Cyan LED creates volumetric beams. Perfectly horizontal and constant. Cinematic, Arri Alexa 65, hyperrealistic." },
    @{ Name = "tech-stack";   Prompt = "Camera on circular track orbits around central black cube left to right at constant speed. Suspended objects sway gently. Fiber-optic threads catch light. Cube shows shifting reflections. Glass spheres create caustics. No zoom, no tilt. Cinematic, Arri Alexa 65, hyperrealistic." },
    @{ Name = "cta-portal";   Prompt = "Steel iris blades retract outward from center at steady speed. Brilliant cyan-white light pours through growing opening. Camera pushes forward slowly. God-rays intensify. Steel blades show real metal grain. Opening fills frame by end. Anamorphic flare. Cinematic, Arri Alexa 65, hyperrealistic." }
)

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$jobIds = @{}

Write-Host "`n=== PHASE 1: SUBMITTING JOBS ===" -ForegroundColor Cyan
foreach ($v in $videos) {
    $body = @{ model = $Model; prompt = $v.Prompt; aspect_ratio = "16:9" }

    # Auto-detect start frame images
    $imgPath = "start_frames\$($v.Name)_start.png"
    if (Test-Path $imgPath) {
        Write-Host "  [IMG] Found: $imgPath" -ForegroundColor Green
        $bytes = [System.IO.File]::ReadAllBytes($imgPath)
        $b64 = [System.Convert]::ToBase64String($bytes)
        $body["image_url"] = "data:image/png;base64,$b64"
    }

    $json = $body | ConvertTo-Json -Depth 10
    $resp = Invoke-RestMethod -Uri "https://openrouter.ai/api/alpha/videos" `
        -Method POST -Headers $headers -Body $json
    $jobIds[$v.Name] = $resp.id
    Write-Host "  [OK] $($v.Name) -> Job: $($resp.id)" -ForegroundColor Green
    Start-Sleep -Seconds 5
}

Write-Host "`n=== PHASE 2: POLLING (5-15 min per video) ===" -ForegroundColor Cyan
$done = @{}
while ($done.Count -lt $videos.Count) {
    foreach ($v in $videos) {
        if ($done.ContainsKey($v.Name)) { continue }
        $st = Invoke-RestMethod `
            -Uri "https://openrouter.ai/api/alpha/videos/$($jobIds[$v.Name])" `
            -Method GET -Headers $headers
        if ($st.status -eq "completed") {
            $out = Join-Path $OutputDir "$($v.Name)_raw.mp4"
            Invoke-WebRequest -Uri $st.unsigned_urls[0] -OutFile $out
            Write-Host "  [DONE] $($v.Name) -> $out" -ForegroundColor Green
            $done[$v.Name] = $true
        } elseif ($st.status -eq "failed") {
            Write-Host "  [FAIL] $($v.Name) -> $($st.error)" -ForegroundColor Red
            $done[$v.Name] = $true
        } else {
            Write-Host "  [WAIT] $($v.Name) -> $($st.status)" -ForegroundColor Yellow
        }
    }
    if ($done.Count -lt $videos.Count) { Start-Sleep -Seconds 30 }
}

Write-Host "`n=== ALL DONE ===" -ForegroundColor Cyan
Write-Host "Raw videos in: $OutputDir"
Write-Host "Next: Run ffmpeg optimization (Section 6)"
```

**Usage:**
```powershell
# Text-to-video only:
.\generate_videos.ps1 -ApiKey "sk-or-v1-your-key"

# Image-to-video (put PNGs in start_frames/ folder first):
#   start_frames/hero_start.png, problem_start.png, etc.
.\generate_videos.ps1 -ApiKey "sk-or-v1-your-key"
# Script auto-detects start frame images
```

---

### Option B: Google AI Studio UI (Manual Fallback)

1. Go to **aistudio.google.com** → **Video FX** or **Video Generation**
2. Select **Veo 2** as the model
3. Click the **image upload** button (📎 or camera icon)
4. Upload your **Start Frame** image
5. In the prompt field, write ONLY the **motion/camera** prompt
6. Set **Aspect Ratio = 16:9**, **Duration = 8 seconds**
7. Generate → Download best variant

> **Critical**: When using Image-to-Video, your text prompt should describe **HOW THINGS MOVE**, not **WHAT THINGS LOOK LIKE**. The image already defines the look.

---

## 3. Master Style Framework

### Realism Rules — Why This Version Is Different

The previous prompts used fantasy/CG language ("holographic," "bioluminescent," "energy particles") which pushes AI generators toward stylized, obviously-fake renders. **This version grounds every element in real physical objects** that the AI has actually been trained on:

| Instead Of (Fake) | Use This (Real) | Why It Works |
|---|---|---|
| "holographic globe" | "a physical glass globe in a dark photography studio" | AI has seen millions of real glass spheres |
| "glowing neural network" | "macro photograph of fiber optic cables" | Real fiber optics look sci-fi naturally |
| "obsidian cube with orbiting shapes" | "black anodized aluminum server chassis on a turntable" | Real metal in real light = instant realism |
| "energy particles" | "dust motes caught in a spotlight beam" | Actual atmospheric particles |
| "translucent glass layers" | "acrylic platform shelves in a product photography studio" | Real material, real light refraction |

### The "ThreatMatrix Image Style Anchor"

Append to **every image generation prompt** to maintain visual cohesion:

```
Photographed in a pitch-black professional studio. Single practical 
cyan LED lighting source. Real physical materials — brushed metal, 
glass, carbon fiber, polished acrylic. Captured on Arri Alexa 65 
with Zeiss Master Anamorphic 40mm lens at T1.9. Shallow depth of 
field, natural bokeh. Fine atmospheric haze from a hazer machine 
caught in the light. No CGI, no compositing — everything is a real 
photographed object. Hyperrealistic, 8K, RAW photograph.
```

### The "ThreatMatrix Motion Style Anchor"

Append to **every Veo motion prompt** (used with Image-to-Video):

```
Cinematic live-action camera movement on a motorized dolly/slider. 
Fluid constant-velocity motion, extremely smooth, no vibration, no 
acceleration, no deceleration, no cuts. Real practical cyan LED 
lighting. Fine atmospheric haze. Continuous single-take. Shot on 
Arri Alexa 65, anamorphic lens, natural lens flare. 8K quality, 
hyperrealistic footage.
```

### Scroll-Scrubbing Rules

| Rule | Why |
|------|-----|
| **Unidirectional motion only** | Scrolling backward while camera reverses looks unnatural |
| **Constant velocity** | If camera accelerates, slow scrollers hit "dead zones" |
| **No cuts** | Jump-cuts cause jarring pops when scrubbing |
| **5–8 second duration** | Sweet spot: enough frames for smooth scrubbing, small file size |

---

## 4. The 7 Sections — Image + Video Prompts

Each section has:
- 🖼️ **START FRAME** prompt — generate this image first
- 🖼️ **END FRAME** prompt — generate for reference (you keep this to know what the video should arrive at)
- 🎬 **VEO MOTION** prompt — paste this into Veo AFTER uploading the Start Frame image
- 📝 **Designer notes** — composition and flow reasoning

---

### V1 — HERO (`hero.mp4`)

**Narrative**: *"The platform is alive — watching every packet on your network"*
**Camera**: Slow dolly push-in toward a real SOC analyst workstation
**Duration**: 8 seconds
**Concept**: This shot introduces ThreatMatrix AI as a REAL operational tool — a live Network Operations Center (NOC) desk with monitors showing actual threat dashboards, real terminal output scrolling, and a live global network map glowing in the dark. No corridors, no abstract shapes. The user sees EXACTLY what ThreatMatrix looks like in use from the moment they land on the page.

#### 🖼️ START FRAME — Image Prompt

```
A cinematic wide establishing shot of a professional cybersecurity 
Network Operations Center (NOC) workstation in a dark, dimly lit room. 
The desk is a wide curved standing desk made of black powder-coated 
steel with a matte carbon fiber surface. Three ultra-wide 32-inch 
curved monitors (Samsung Odyssey or similar) are arranged in a slight 
arc, each displaying different screens:

- LEFT MONITOR: A dark-themed terminal window with green-on-black text 
  showing real network log lines scrolling upward — IP addresses, port 
  numbers, packet size readings, timestamps in monospace font. One line 
  is highlighted in red — a detected anomaly alert.

- CENTER MONITOR (largest): A world map visualization rendered in a 
  dark atlas style with glowing cyan dots representing network nodes 
  across continents. Thin cyan arc lines connect nodes, showing live 
  traffic flows. Two bright red pulsing dots mark active threat locations 
  over Eastern Europe and Southeast Asia. This looks exactly like the 
  deck.gl network map in the ThreatMatrix dashboard.

- RIGHT MONITOR: A dark dashboard UI showing real-time charts — a 
  line graph of anomaly scores over the last hour, a bar chart of 
  traffic volume by protocol, and three ML model status indicators 
  (Isolation Forest, Random Forest, Autoencoder) each showing green 
  "ACTIVE" status with confidence percentages.

On the desk surface: a mechanical keyboard with subtle RGB backlighting 
(mostly off except for cyan underglow), a precision mouse, a ceramic 
coffee mug, and a small physical notebook with handwritten notes barely 
visible. Two empty energy drink cans off to the side. Real cables run 
behind the monitors — DisplayPort and USB-C in matte black cable sleeves.

The room is nearly pitch-black except for the monitor glow illuminating 
the desk and casting blue-cyan light in the immediate area. Atmospheric 
haze in the background catches the monitor light, creating a soft 
volumetric cyan glow around the workstation. The camera is positioned 
3-4 meters away from the desk, at slightly above eye level, looking 
slightly downward at the entire setup.

Photographed using available light only (monitor glow as the only 
practical light source). Captured on Sony Venice 2 with Leica Summilux-C 
25mm lens at T1.4. Very shallow depth of field — the monitors are sharp 
and everything outside the desk fades into dark bokeh. Blue-cyan color 
cast from monitor glow on all surfaces. Fine atmospheric haze in the 
room background. No people, empty workstation, system is running 
autonomously. Hyperrealistic, 8K, RAW photograph, photojournalism style.
```

#### 🖼️ END FRAME — Image Prompt (Reference Only)

```
The same NOC workstation, now much closer — the camera has pushed in 
to about 60cm from the center monitor. The world map on the center 
monitor fills the entire frame. The cyan network arc lines and red 
threat dots are now large enough to read individual city labels at 
the node connection points. A new bright red alert notification has 
appeared in the top-right corner of the center monitor with "ANOMALY 
DETECTED — ISOLATION FOREST — 94.7% confidence" in white text on red. 
The left terminal monitor is now soft-focus at the left edge of frame, 
its scrolling green text a blur of motion. The right stats monitor is 
soft-focus at the right edge. The monitor bezels show real fingerprint 
smudges and dust particles at this close distance. The cyan glow from 
the screen illuminates the keyboard keys in the foreground, which are 
slightly blurred.

Captured on Sony Venice 2 with Leica Summilux-C 25mm lens at T1.4. 
Extremely shallow depth of field. Monitor glow only. Hyperrealistic, 
8K, RAW photograph.
```

#### 🎬 VEO MOTION PROMPT (paste with Start Frame uploaded)

```
Cinematic 16:9 motorized dolly push-in toward the center monitor of a 
glowing NOC workstation. The camera glides forward with fluid, 
constant velocity—no acceleration, deceleration, or vibration. Starting 
with a wide view of the desk, this continuous single-take pushes 
seamlessly into a tight close-up of the center screen's world map. 
During the approach, green text on the left terminal continuously 
scrolls while cyan network arcs pulse. The monitors provide the only 
practical light, illuminating fine atmospheric haze that drifts around 
the room. Midway through the push, a red anomaly alert flashes on the 
center screen, casting a dynamic, volumetric red glow across the 
physical desk surface.

Shot on Sony Venice 2 with Leica Summilux-C prime for natural depth 
of field, fading the room into dark bokeh. Masterpiece 8K quality, 
perfectly framed for 16:9 aspect ratio. Hyperrealistic, state-of-the-art 
live-action footage optimized for seamless Veo 3.1 motion flow execution.
```

**Negative prompt**: `text watermark blurry shaky CGI 3D render cartoon digital art camera stopping reverse motion human face people hands bright overhead lighting fluorescent lights white walls`

> 📝 **Designer Note**: This shot works because it shows the REAL product. A user landing on the About page immediately sees three monitors running ThreatMatrix — they understand instantly what the product IS. The push-in creates intimacy, as if you're approaching a workstation that's been running all night. The autonomously-running system (no person present) communicates reliability. The red alert mid-push creates narrative tension that the hero text can resolve.
>
> **Codebase accuracy**: The center screen deck.gl world map is in `app/network/page.tsx`. The terminal on the left maps to the real-time log stream from `capture/engine.py` via WebSocket. The right dashboard maps to `app/ml-ops/page.tsx` with the three ML model indicators from `ml/models/isolation_forest.py`, `random_forest.py`, `autoencoder.py`.

---

### V2 — PROBLEM (`problem.mp4`)

**Narrative**: *"You see the threat landscape"*
**Camera**: Slow orbital pan (left to right)
**Duration**: 8 seconds

#### 🖼️ START FRAME — Image Prompt

```
A large physical glass globe of Earth (approximately 60cm diameter) 
sitting on a matte black pedestal in a completely dark photography 
studio. The globe is made of frosted borosilicate glass with etched 
continental outlines. It is internally illuminated by dim cyan LEDs 
that reveal the etched landmass patterns. Three small clusters of 
red fiber-optic pinpoints glow on the surface over Eastern Africa, 
the Middle East, and South Asia — these look like tiny real LED 
diodes embedded in the glass. Thin red laser-line arcs are projected 
between the red clusters using a real laser projector. A single 
practical cyan spotlight illuminates the globe from the upper-left, 
creating dramatic side-lighting with the right hemisphere in deep 
shadow. Fine atmospheric haze drifts behind the globe, catching the 
cyan backlight. The camera views from slightly above and to the left.

Photographed in a pitch-black professional studio. Single practical 
cyan LED lighting source. Real physical materials — brushed metal, 
glass, carbon fiber, polished acrylic. Captured on Arri Alexa 65 
with Zeiss Master Anamorphic 40mm lens at T1.9. Shallow depth of 
field, natural bokeh. Fine atmospheric haze from a hazer machine 
caught in the light. No CGI, no compositing — everything is a real 
photographed object. Hyperrealistic, 8K, RAW photograph.
```

#### 🖼️ END FRAME — Image Prompt (Reference Only)

```
The same physical glass globe, now viewed from slightly above and to 
the right (camera has orbited approximately 90 degrees clockwise around 
the pedestal). The African continent has rotated partially away. 
Different red fiber-optic clusters are now visible. More red pinpoints 
have appeared across additional regions. The cyan spotlight now 
illuminates from the upper-right, casting shadow on the left hemisphere. 
The haze has thickened slightly, diffusing the backlight. The laser 
arc lines catch the haze, creating faint red beams visible in the air.

Photographed in a pitch-black professional studio. Captured on Arri 
Alexa 65 with Zeiss Master Anamorphic 40mm lens at T1.9. Shallow 
depth of field, natural bokeh. Hyperrealistic, 8K, RAW photograph.
```

#### 🎬 VEO MOTION PROMPT

```
Cinematic 16:9 motorized circular track orbit from left to right around a glowing 
glass globe. The camera glides seamlessly with fluid, constant velocity—no 
acceleration, deceleration, or vibration. The globe remains still on its pedestal as 
the continuous single-take wraps around it. Red fiber-optic pinpoints pulse gently 
while projected red laser arcs shimmer through the atmospheric haze. As the camera 
orbits, a practical cyan spotlight creates flawlessly shifting highlights and shadows 
across the frosted glass surface. The track maintains a perfectly constant distance 
and horizontal plane with zero zoom or vertical drift.

Shot on Arri Alexa 65 with anamorphic lens, generating stunning natural flare. 
Masterpiece 8K quality, perfectly framed for 16:9 aspect ratio. Hyperrealistic, 
state-of-the-art live-action footage optimized for seamless Veo 3.1 motion flow execution.
```

**Negative prompt**: `text, watermark, blurry, CGI, 3D render, cartoon, digital art, photoshopped, bright background, zoom, fast motion`

> 📝 **Designer Note**: A real glass globe in a real studio with real projected laser lines = Veo produces something indistinguishable from actual cinematography. The frosted glass + internal LEDs give it a sci-fi quality without looking like a video game.

---

### V3 — ARCHITECTURE (`architecture.mp4`)

**Narrative**: *"You see how ThreatMatrix is built — layer by layer"*
**Camera**: Vertical tilt-up (bottom to top)
**Duration**: 8 seconds

#### 🖼️ START FRAME — Image Prompt

```
Three horizontal shelves made of thick clear acrylic (Plexiglas), 
stacked vertically with 40cm gaps between them, mounted on thin 
black metal rods in a pitch-black photography studio. The camera 
is at the level of the BOTTOM shelf, looking slightly upward. 

The BOTTOM shelf has warm orange LED strip-lights along its edges, 
illuminating its surface from within. Small real circuit board 
components (resistors, capacitors, ribbon cables) are arranged on 
the acrylic surface, casting tiny shadows. 

The MIDDLE shelf (above) has cyan LED strips along its edges. On its 
surface, bundles of thin fiber-optic cables glow cyan from their tips, 
with the strands fanning out in a web-like pattern. 

The TOP shelf (highest) has purple-violet LED strips. A small 
transparent LCD screen sits on it, displaying faint dashboard UI 
graphics. 

Fine atmospheric haze rises upward between the shelves, caught in 
the colored lights — orange haze near the bottom, transitioning to 
cyan in the middle and purple at the top. Dust motes float upward 
through the light beams.

Photographed in a pitch-black professional studio. Real physical 
materials — brushed metal, glass, carbon fiber, polished acrylic. 
Captured on Arri Alexa 65 with Zeiss Master Anamorphic 40mm lens at 
T1.9. Shallow depth of field, natural bokeh. Fine atmospheric haze 
from a hazer machine. No CGI, no compositing. Hyperrealistic, 8K, 
RAW photograph.
```

#### 🖼️ END FRAME — Image Prompt (Reference Only)

```
The same three acrylic shelves, but now the camera has risen to the 
level of the TOP purple shelf, looking slightly downward. The top 
shelf's transparent LCD screen is now closest and largest in frame, 
its purple-lit dashboard graphics clearly visible. The middle cyan 
shelf with fiber optics is below at mid-distance. The bottom orange 
shelf with circuit components is far below, small in perspective, 
its warm glow visible through the haze layers. The camera looks 
down through the stack — you can see all three tiers receding below. 
Haze rises upward past the lens.

Photographed in a pitch-black professional studio. Captured on Arri 
Alexa 65 with Zeiss Master Anamorphic 40mm lens at T1.9. Shallow 
depth of field, natural bokeh. Hyperrealistic, 8K, RAW photograph.
```

#### 🎬 VEO MOTION PROMPT

```
Cinematic 16:9 motorized vertical jib shot rising smoothly upward at a 
fluid, constant velocity—no acceleration, deceleration, or vibration. Starting 
at the bottom orange-lit acrylic shelf, this continuous single-take ascends 
past the middle cyan shelf up to the top purple shelf. Fine atmospheric haze 
and dust motes drift upward alongside the lens. The orange circuit boards 
pass smoothly below and out of frame, followed by the cyan fiber-optic web, 
until the top purple LCD screen grows closer in sharp detail. The perfectly 
constant upward motion ensures each illuminated shelf passes through the frame 
at flawlessly equal intervals.

Shot on Arri Alexa 65 with anamorphic lens capturing practical LED lighting 
and natural flare. Masterpiece 8K quality, perfectly framed for 16:9 aspect 
ratio. Hyperrealistic, state-of-the-art live-action footage optimized for seamless Veo 3.1 motion flow execution.
```

**Negative prompt**: `text, watermark, blurry, CGI, 3D render, cartoon, digital art, horizontal motion, downward motion, cuts, fast motion, bright background`

> 📝 **Designer Note**: Real acrylic shelves with real LEDs and real circuit components = Veo produces actual product-photography-quality footage. The vertical jib/crane motion maps perfectly to scroll — scrolling literally "climbs" the architecture. The three LED colors (orange→cyan→purple) match your existing design system tier colors.

---

### V4 — ML MODELS (`ml-models.mp4`)

**Narrative**: *"You dive deep into the intelligence"*
**Camera**: Slow zoom-in (macro into neural structure)
**Duration**: 8 seconds

#### 🖼️ START FRAME — Image Prompt

```
A real macro photograph of a large bundle of fiber optic cables in a 
pitch-black studio. Hundreds of thin glass fiber strands fan outward 
from a central trunk, creating an organic tree-like structure. Each 
fiber tip glows with either cyan or soft purple light, fed by real 
LED sources at the cable ends. The fibers create a complex web of 
glowing connections — some strands crossing, some running parallel. 
The central bundle is thickest and brightest. Individual fiber strands 
are razor-sharp in the center of frame, with the outer edges falling 
into soft, creamy bokeh. Fine dust particles float in the air between 
the fibers, catching the colored light. The overall shape fills about 
60% of the frame. Camera is positioned wide enough to see the full 
spread of the fiber structure.

Photographed in a pitch-black professional studio. Real physical 
materials — glass fiber optics, rubber cable sheathing. Captured on 
Arri Alexa 65 with Zeiss Master Anamorphic 40mm lens at T1.9. Very 
shallow depth of field, natural bokeh. Fine atmospheric haze. No CGI, 
no compositing. Hyperrealistic, 8K, RAW macro photograph.
```

#### 🖼️ END FRAME — Image Prompt (Reference Only)

```
Extreme macro close-up of two individual fiber optic cable tips, 
filling the left and right sides of the frame. Between them, several 
thin glass fiber strands bridge the gap, carrying pulses of cyan and 
purple light — visible as tiny bright dots traveling along the 
transparent glass threads. The fiber tip surfaces show real glass 
texture — cylindrical cross-sections with cladding visible at this 
magnification. Everything outside the two tips is heavily blurred 
with extremely shallow depth of field. The light from the fiber tips 
creates a soft halo glow on the surrounding dark air. A few dust 
motes are caught in the light between the strands.

Photographed in a pitch-black professional studio. Extreme macro lens. 
Captured on Arri Alexa 65. Very shallow depth of field, natural bokeh. 
Hyperrealistic, 8K, RAW macro photograph.
```

#### 🎬 VEO MOTION PROMPT

```
Cinematic 16:9 macro dolly push-in advancing deep into the center of a 
glowing fiber-optic bundle. The camera glides with fluid, constant velocity—
no acceleration, deceleration, or vibration. In this continuous single-take, 
outer fiber strands slide past and fall into soft bokeh as the central illuminated 
junction grows larger. Individual fibers resolve into thick, glowing threads 
while intricate light pulses travel seamlessly along the glass. The push is 
perfectly linear, with depth of field narrowing beautifully as the camera nears 
the central focal point, blurring the dark edges, while dust particles drift past.

Shot on Arri Alexa 65 with anamorphic macro lens capturing deep, natural bokeh 
and practical LED luminescence. Masterpiece 8K quality, perfectly framed for 16:9 
aspect ratio. Hyperrealistic, state-of-the-art live-action footage optimized for seamless Veo 3.1 motion flow execution.
```

**Negative prompt**: `text, watermark, blurry, CGI, 3D render, cartoon, digital art, zoom out, reverse, organic brain, human tissue, fast motion, cuts`

> 📝 **Designer Note**: Real fiber optics are nature's perfect "neural network" stand-in — they look like sci-fi while being completely photorealistic. The macro zoom creates a "deeper knowledge" metaphor. As the user scrolls past the ML Model cards, they're visually diving deeper into the fibers. The shallow DOF at the end frame creates a dreamy, focused feel that AI generators render beautifully because it mimics real photography.

---

### V5 — COMPETITIVE EDGE (`competitive.mp4`)

**Narrative**: *"You see the disruption — old world vs. new world"*
**Camera**: Horizontal dolly (left to right)
**Duration**: 8 seconds

#### 🖼️ START FRAME — Image Prompt

```
A real photograph of a wide tabletop scene in a pitch-black studio, 
composed as a horizontal diptych. On the LEFT side: a real 42U server 
rack (Dell/HP enterprise type), gunmetal grey, with tangled CAT6 
ethernet cables, dusty surfaces, and several blinking amber and red 
status LEDs. A harsh warm tungsten overhead work-light illuminates 
it from above, creating hard shadows. The server rack looks heavy, 
expensive, and outdated. On the RIGHT side: the scene fades to 
near-total darkness, with only a faint cyan glow hinting at something 
just out of frame. A thin vertical beam of cyan light marks the 
center divide between the two halves. The camera is positioned on the 
far left, the old server rack filling most of the frame. Dust particles 
float in the harsh overhead light.

Photographed in a pitch-black professional studio. Real physical 
materials — enterprise server hardware, ethernet cables, metal racks. 
Captured on Arri Alexa 65 with Zeiss Master Anamorphic 40mm lens at 
T1.9. Shallow depth of field, natural bokeh. Fine atmospheric haze. 
No CGI, no compositing. Hyperrealistic, 8K, RAW photograph.
```

#### 🖼️ END FRAME — Image Prompt (Reference Only)

```
The same tabletop scene, but now the camera has dollied to the far 
right. The old server rack is barely visible at the far left edge, 
fading into darkness. The RIGHT side now dominates the frame: a sleek, 
minimalist black anodized aluminum device — a small hexagonal chassis 
about 30cm tall, with polished beveled edges, sitting on a black 
acrylic stand. It has a clean cyan LED ring light around its base 
and thin fiber optic strands radiating outward to smaller satellite 
devices. The cyan LED illuminates the device and the surrounding haze 
beautifully, creating volumetric light beams. The device's surface 
is mirror-polished, reflecting the cyan light. It looks minimal, 
powerful, premium — like an Apple product designed for cybersecurity. 
The contrast with the old server rack is dramatic.

Photographed in a pitch-black professional studio. Captured on Arri 
Alexa 65 with Zeiss Master Anamorphic 40mm lens at T1.9. Shallow 
depth of field, natural bokeh. Hyperrealistic, 8K, RAW photograph.
```

#### 🎬 VEO MOTION PROMPT

```
Cinematic 16:9 motorized horizontal dolly sliding smoothly from left to right 
across a dramatic tabletop diptych. The camera tracks with fluid, constant velocity—
no acceleration, deceleration, or vibration. Starting on a dusty server rack under 
harsh tungsten light, this continuous single-take slides rightward, crossing the 
lit center divide where illumination flawlessly transitions from warm amber to cool 
cyan. The sleek black hexagonal device on the right grows prominent, its cyan LED 
casting vibrant volumetric light beams through drifting atmospheric haze. The motion 
is impeccably horizontal, with zero tilt or vertical drift.

Shot on Arri Alexa 65 with anamorphic lens for brilliant natural flare. Masterpiece 8K 
quality, perfectly framed for 16:9 aspect ratio. Hyperrealistic, state-of-the-art 
live-action footage optimized for seamless Veo 3.1 motion flow execution.
```

**Negative prompt**: `text, watermark, blurry, CGI, 3D render, cartoon, digital art, people, vertical motion, zoom, fast motion, bright background`

> 📝 **Designer Note**: Real server hardware vs. a real premium device = instant believable contrast. The warm-to-cool light transition as the camera dollies across is something Veo handles incredibly well because it mimics real cinematography lighting transitions. The dust motes changing color at the crossover point is a chef's-kiss detail.

---

### V6 — TECH STACK (`tech-stack.mp4`)

**Narrative**: *"The real infrastructure powering every detection"*
**Camera**: Slow sliding lateral reveal across a backlit components panel
**Duration**: 8 seconds
**Concept**: Instead of an abstract sculpture, this shot shows the ACTUAL physical hardware and software components that ThreatMatrix AI is built on — a premium product photography composition of real server components, PCBs, RAM modules, and ethernet infrastructure arranged as a flat-lay hero shot under dramatic studio lighting. The camera slides laterally to reveal each layer of the stack from left to right, matching the data flow of the app: Capture → Redis → ML → PostgreSQL → API → Frontend.

#### 🖼️ START FRAME — Image Prompt

```
A wide, dramatic product photography flat-lay shot on a matte black 
anodized aluminum surface, photographed from slightly above (about 30
degrees from horizontal, not straight down). The composition spans 
horizontally across the frame from left edge to right edge.

Arranged LEFT TO RIGHT across the surface, the following real physical 
objects are laid out in a clean, deliberate product-photography style 
with precise spacing:

FAR LEFT (partially cut off, entering frame): A real network interface 
card (NIC) — a full-length PCIe card with a brushed aluminum heatsink, 
two SFP+ ports visible at the bracket edge, and small status LEDs 
glowing amber and green. This represents Scapy packet capture.

LEFT-CENTER: A real Intel NUC-style mini PC (small black aluminum box, 
approximately 12cm x 12cm x 5cm) with a single blinking green power 
LED and a small red LED on the side. Underneath it, fanned out like 
a hand of cards, are five real CAT8 ethernet cables (flat profile) 
in black with cyan boots at the RJ45 ends. This represents the capture 
engine and Redis pub/sub stream.

CENTER: A real 1U server front panel (just the front face plate, 
detached, laid flat on the surface) — a black aluminum panel with a 
matrix of 24 small blinking LEDs (mix of green, amber, one red) and 
two vertical arrays of small ventilation slots. This represents the 
FastAPI/Uvicorn backend cluster.

RIGHT-CENTER: Three real DDR5 RAM modules (Samsung or Corsair, the 
kind with the heatspreader fins) laid out in a slight fan arrangement, 
showing the gold contact edges and the PCB traces visible through the 
translucent heat spreader. Next to them: a small SSD (M.2 2280 form 
factor) with its PCB components visible. This represents the PostgreSQL 
database and TensorFlow ML model storage.

FAR RIGHT (partially entering frame from right edge): A real Raspberry 
Pi 5 board laid bare — no case, fully exposed green PCB with gold and 
silver components visible, the GPIO pins a row of tiny silver teeth. 
A microSD card is inserted. This represents the ML inference worker 
(Isolation Forest, Random Forest, Autoencoder).

Each object is separated by approximately 4-5cm of bare black surface. 
Thin matte black cable ties connect some of the ethernet cables in 
precise bundles. A single practical cyan LED light source from the 
top-right of frame illuminates everything with sharp, directional 
single-source lighting creating clean shadows to the lower-left. Fine 
back-lighting from a thin LED strip hidden at the far rear edge of 
the surface creates a very subtle cyan rim light behind all objects.

No text visible on any object. No brand logos visible. Camera is 
positioned at the FAR LEFT end of the composition — only seeing the 
NIC and the mini PC fully, with everything else extending to the right 
out of frame.

Photographed in a professional product photography studio. Single 
directional cyan LED key light from upper-right. Subtle cyan rim light 
from rear. Matte black aluminum surface. Captured on Arri Alexa 65 
with Zeiss Master Anamorphic 40mm lens at T2.8. Shallow depth of 
field, natural bokeh on far-right objects. Fine atmospheric haze 
from hazer in background. No CGI, no compositing. Hyperrealistic, 
8K, RAW product photograph.
```

#### 🖼️ END FRAME — Image Prompt (Reference Only)

```
The same flat-lay product composition on the black anodized aluminum 
surface, but now the camera has slid to the FAR RIGHT. The Raspberry 
Pi board is now fully centered in frame, its bare green PCB filling 
the center with all components in sharp focus. The M.2 SSD and RAM 
modules are visible to its left, now moving toward the left edge and 
slightly defocused. The NIC and mini PC are now off-frame to the left. 
The Raspberry Pi's GPIO pins catch the cyan key light with razor-sharp 
precision — each tiny silver pin individually visible with specular 
highlight. The microSD card reflects the cyan rim light. Fine cable 
ties on the ethernet cables catch the light at new angles to the left. 
The rear cyan rim light creates a clean separation line behind the Pi.

Captured on Arri Alexa 65 with Zeiss Master Anamorphic 40mm lens at 
T2.8. Shallow depth of field. Hyperrealistic, 8K, RAW photograph.
```

#### 🎬 VEO MOTION PROMPT

```
Cinematic 16:9 motorized precision slider tracking horizontally left to right 
across a flat-lay technology arrangement. The camera traverses the black 
anodized surface with fluid, constant velocity—no acceleration, deceleration, 
tilt, zoom, or vibration. This continuous single-take begins at the network 
card on the far left and finishes seamlessly on the Raspberry Pi board at the 
far right. As components enter the center-frame focus zone, they render in 
exquisite sharp detail before sliding into lush, soft bokeh. Hardware status LEDs 
blink natively in the practical cyan lighting, while ambient haze drifts gently 
in the background.

Shot on Arri Alexa 65 with anamorphic lens for spectacular depth of field falloff. 
Masterpiece 8K quality, perfectly framed for 16:9 aspect ratio. Hyperrealistic, 
state-of-the-art live-action product footage optimized for seamless Veo 3.1 motion flow execution.
```

**Negative prompt**: `text, watermark, blurry, CGI, 3D render, cartoon, digital art, logos, brand names visible, vertical motion, zoom, fast motion, bright white background, overhead flat lighting, human hands, people`

> 📝 **Designer Note**: This works because each physical object IS the actual tech that ThreatMatrix runs on. The camera horizontally slides LEFT → RIGHT which matches the data flow of the system: Capture (NIC / Scapy) → Stream (Redis / mini PC) → API (FastAPI server panel) → Storage (PostgreSQL DDR5 / SSD) → ML (TensorFlow / Raspberry Pi). As the user scrolls this section, the tech stack cards and labels appear in sync with that corresponding component entering the frame center.
>
> **Codebase accuracy mapping:**
> - NIC = `capture/engine.py` (Scapy → raw packet capture, `capture_interface: eth0`)
> - Mini PC + ethernet = `app/redis.py` + Redis pub/sub pub (`capture/publisher.py`)
> - Server front panel = `app/main.py` (FastAPI/Uvicorn, 4 workers, `docker-compose.yml`)
> - RAM + SSD = `app/database.py` (PostgreSQL/asyncpg, `alembic` migrations)
> - Raspberry Pi = `ml/models/` (Isolation Forest, Random Forest, Autoencoder + TensorFlow 2.18)

---

### V7 — CTA PORTAL (`cta-portal.mp4`)

**Narrative**: *"You're invited inside — enter the War Room"*
**Camera**: Forward push through opening door
**Duration**: 8 seconds

#### 🖼️ START FRAME — Image Prompt

```
A large real mechanical iris diaphragm (like a giant camera aperture 
or submarine hatch) mounted in a thick dark steel bulkhead wall, 
completely closed. The iris has 8 overlapping blades made of thick 
brushed stainless steel, meeting at the center point to form a tight 
seal. Each blade has machine-tooled pivot rivets visible at the outer 
edge. The metal surface has real brushed-steel grain texture, with 
tiny scratches and wear marks from use. A faint cyan light seeps 
through the hairline gaps between the blades, hinting at something 
beyond. The bulkhead frame around the iris has real industrial hex 
bolts, welded seams, and CNC-machined guide channels. The surrounding 
wall is painted matte black. The camera faces the iris straight on 
at center height. Fine haze drifts across the frame, catching the 
cyan gap-light.

Photographed in a pitch-black professional studio. Real physical 
materials — stainless steel, machined metal, industrial hardware. 
Captured on Arri Alexa 65 with Zeiss Master Anamorphic 40mm lens at 
T1.9. Shallow depth of field, natural bokeh. Fine atmospheric haze. 
No CGI, no compositing. Hyperrealistic, 8K, RAW photograph.
```

#### 🖼️ END FRAME — Image Prompt (Reference Only)

```
The same mechanical iris diaphragm, now fully open. The 8 stainless 
steel blades are retracted into the bulkhead housing, their overlap 
pattern visible at the rim. Through the circular opening, a brilliant 
wash of white-cyan light floods the frame from a powerful Arri 
SkyPanel LED behind the opening. The light overexposes slightly in 
the center, creating natural bloom. Within the bright light, the 
faint silhouettes of real physical objects are visible — metal 
frameworks, a desk or console shape, suspended screens — like looking 
into a lit room through a circular port. Volumetric god-rays pour 
through the aperture into the hazy dark foreground air. The steel 
blades catch and reflect the cyan light on their polished inner 
surfaces. The camera has pushed forward so the opening nearly fills 
the entire frame.

Photographed in a pitch-black professional studio. Captured on Arri 
Alexa 65 with Zeiss Master Anamorphic 40mm lens at T1.9. Natural 
light bloom, natural lens flare. Hyperrealistic, 8K, RAW photograph.
```

#### 🎬 VEO MOTION PROMPT

```
Cinematic 16:9 motorized dolly push-in perfectly synchronized with the 
retraction of steel iris blades. The heavy metal aperture opens outward from the 
center at a fluid, constant velocity while the camera advances simultaneously 
with no acceleration, deceleration, or vibration. As the continuous single-take 
pushes steadily inward, a brilliant cyan-white LED light pours through the 
growing opening framing volumetric god-rays in the atmospheric haze. The 
brushed steel blades catch and reflect the light exquisitely, glowing with rich 
mechanical detail. By the flawless conclusion, the opening dominates the frame 
with a staggering natural light bloom.

Shot on Arri Alexa 65 with anamorphic lens, yielding stunning horizontal flare 
streaks from the core light source. Masterpiece 8K quality, perfectly framed for 
16:9 aspect ratio. Hyperrealistic, state-of-the-art live-action footage optimized for seamless Veo 3.1 motion flow execution.
```

**Negative prompt**: `text, watermark, blurry, CGI, 3D render, cartoon, digital art, people, faces, door closing, reverse, fast motion, cuts`

> 📝 **Designer Note**: Real iris mechanisms exist (camera shutters, submarine hatches, stage lighting) — Veo has trained on thousands of these. The key to realism is describing real metal grain, real rivets, real machine wear marks. The god-rays through haze is a real optical phenomenon that AI reproduces flawlessly. The natural anamorphic flare streaks in the end frame make the light feel absolutely cinematic.

---

## 5. Step-by-Step Manual Workflow

### Phase 1: Generate Start Frames (Day 1 — ~1 hour)

```
Step 1.  Open your image generator (Google AI Studio / ImageFX / Midjourney)
Step 2.  Set output: 16:9 aspect ratio, highest quality available

Step 3.  For each section (V1–V7):
           a. Paste the "START FRAME — Image Prompt"
           b. Generate 4 variations
           c. Pick the one with:
              ✓ Cleanest black background (no grey noise)
              ✓ Best cyan color accuracy
              ✓ Most detailed foreground elements
              ✓ Best overall composition
           d. Download as PNG (lossless quality)
           e. Name it: hero_start.png, problem_start.png, etc.

Step 4.  OPTIONAL — generate End Frames for reference:
           a. Paste each "END FRAME — Image Prompt"
           b. Generate 2 variations each
           c. Download as reference (you won't upload these to Veo)

Step 5.  You should now have 7 Start Frame PNGs
```

### Phase 2: Generate Videos (Day 1 — ~2 hours)

```
Step 1.  Open aistudio.google.com → Video FX → Select Veo 2
Step 2.  Set: Aspect Ratio = 16:9, Duration = 8s

Step 3.  For each section (V1–V7):
           a. Click the IMAGE UPLOAD button
           b. Upload the matching Start Frame PNG (e.g., hero_start.png)
           c. In the prompt box, paste ONLY the "VEO MOTION PROMPT"
              (NOT the image prompt — don't describe visuals again)
           d. If available, paste the Negative Prompt in the negative field
           e. Generate 4 variations
           f. Review all 4 — pick the one with:
              ✓ Motion starts from EXACTLY your start frame 
              ✓ Smoothest camera motion (no jerking or stuttering)
              ✓ Most linear movement (no reversals)
              ✓ End frame looks close to your End Frame reference
           g. Download as hero_raw.mp4, problem_raw.mp4, etc.

Step 4.  You should now have 7 raw MP4 files
```

### Phase 3: Quality Review (30 minutes)

Play each clip at **0.25x speed** (right-click → playback speed in VLC or browser):

| Check | Pass | If Fails |
|-------|------|----------|
| Motion is in ONE direction only | ✓ | Re-generate, add "unidirectional, no reverse" |
| No cuts or jumps | ✓ | Re-generate |
| Start frame matches your image | ✓ | Re-upload at higher resolution |
| Cyan color is consistent | ✓ | Add "neon cyan glow, not blue, not green" |
| Background is pure black | ✓ | Add "absolute black void, no ambient light" |
| Looks good at slow speed | ✓ | This IS the scroll experience |
| Camera speed is constant | ✓ | Add "constant velocity, no speed changes, metronome-like" |

### Phase 4: Cohesion Check

Play all 7 clips back-to-back in a video player. Ask:

- [ ] Do they feel like the **same visual universe**?
- [ ] Is the **cyan accent** the same shade in all clips?
- [ ] Is the **brightness/contrast** consistent?
- [ ] Does the **camera speed** feel similar across clips?
- [ ] Does the **story flow** (enter → threat → architecture → brain → disrupt → ecosystem → invitation)?

If any clip feels "off" — re-generate with a stronger style anchor or adjust its brightness/contrast in ffmpeg (see Section 6).

---

## 6. Post-Production with ffmpeg

### Install ffmpeg (if not installed)

```powershell
winget install FFmpeg
```

Or download from [ffmpeg.org/download.html](https://ffmpeg.org/download.html)

### Step 1: Optimize for Web (Target < 3MB per clip)

```bash
# Run from your Downloads folder (where the raw files are)

ffmpeg -i hero_raw.mp4 -c:v libx264 -preset slow -crf 28 -vf "scale=1920:1080" -an -movflags +faststart -pix_fmt yuv420p hero.mp4

ffmpeg -i problem_raw.mp4 -c:v libx264 -preset slow -crf 28 -vf "scale=1920:1080" -an -movflags +faststart -pix_fmt yuv420p problem.mp4

ffmpeg -i architecture_raw.mp4 -c:v libx264 -preset slow -crf 28 -vf "scale=1920:1080" -an -movflags +faststart -pix_fmt yuv420p architecture.mp4

ffmpeg -i ml-models_raw.mp4 -c:v libx264 -preset slow -crf 28 -vf "scale=1920:1080" -an -movflags +faststart -pix_fmt yuv420p ml-models.mp4

ffmpeg -i competitive_raw.mp4 -c:v libx264 -preset slow -crf 28 -vf "scale=1920:1080" -an -movflags +faststart -pix_fmt yuv420p competitive.mp4

ffmpeg -i tech-stack_raw.mp4 -c:v libx264 -preset slow -crf 28 -vf "scale=1920:1080" -an -movflags +faststart -pix_fmt yuv420p tech-stack.mp4

ffmpeg -i cta-portal_raw.mp4 -c:v libx264 -preset slow -crf 28 -vf "scale=1920:1080" -an -movflags +faststart -pix_fmt yuv420p cta-portal.mp4
```

**Flags explained**:
| Flag | What It Does |
|------|-------------|
| `-c:v libx264` | H.264 codec — plays everywhere |
| `-preset slow` | Better compression, smaller file |
| `-crf 28` | Quality (23=big/sharp, 28=small/good, 32=tiny/soft) |
| `-vf "scale=1920:1080"` | Full HD |
| `-an` | Strip audio (silent backgrounds) |
| `-movflags +faststart` | Enable streaming before full download |
| `-pix_fmt yuv420p` | Max browser compatibility |

### Step 2: Mobile Variants (720p — for Ethiopia/slow connections)

```bash
ffmpeg -i hero.mp4 -c:v libx264 -preset slow -crf 32 -vf "scale=1280:720" -an -movflags +faststart -pix_fmt yuv420p hero-mobile.mp4

# Repeat for all 7 clips
```

### Step 3: Color/Brightness Correction (If Needed)

If one clip is noticeably brighter or has a color cast:

```bash
# Darken a clip that's too bright (reduce to 80% brightness):
ffmpeg -i problem.mp4 -vf "eq=brightness=-0.08:contrast=1.1" -c:v libx264 -crf 28 -an problem_corrected.mp4

# Shift color toward cyan if it went too blue:
ffmpeg -i hero.mp4 -vf "hue=h=10:s=1.1" -c:v libx264 -crf 28 -an hero_corrected.mp4
```

---

## 7. Creating Poster Frames

Extract the most visually rich frame from each clip:

```bash
ffmpeg -i hero.mp4 -ss 3 -vframes 1 -q:v 2 poster-hero.webp
ffmpeg -i problem.mp4 -ss 3 -vframes 1 -q:v 2 poster-problem.webp
ffmpeg -i architecture.mp4 -ss 4 -vframes 1 -q:v 2 poster-architecture.webp
ffmpeg -i ml-models.mp4 -ss 3 -vframes 1 -q:v 2 poster-ml-models.webp
ffmpeg -i competitive.mp4 -ss 4 -vframes 1 -q:v 2 poster-competitive.webp
ffmpeg -i tech-stack.mp4 -ss 3 -vframes 1 -q:v 2 poster-tech-stack.webp
ffmpeg -i cta-portal.mp4 -ss 5 -vframes 1 -q:v 2 poster-cta-portal.webp
```

**Tip**: `-ss 3` = 3-second mark. Adjust per clip — for CTA portal, use `-ss 5` when the iris is more open.

---

## 8. File Placement Checklist

Copy all final files to your project:

```
frontend/public/videos/about/
├── hero.mp4                 ← Desktop (1920x1080, < 3MB)
├── problem.mp4
├── architecture.mp4
├── ml-models.mp4
├── competitive.mp4
├── tech-stack.mp4
├── cta-portal.mp4
├── hero-mobile.mp4          ← Mobile (1280x720, < 1MB)  [OPTIONAL]
├── problem-mobile.mp4
├── ...
├── poster-hero.webp         ← Poster frames (< 100KB each)
├── poster-problem.webp
├── poster-architecture.webp
├── poster-ml-models.webp
├── poster-competitive.webp
├── poster-tech-stack.webp
└── poster-cta-portal.webp
```

### Verify file sizes:
```powershell
Get-ChildItem frontend\public\videos\about\* | Select-Object Name, @{n='SizeMB';e={[math]::Round($_.Length/1MB,2)}}
```

| File Type | Target | Max |
|-----------|--------|-----|
| Desktop MP4 | 1.5–3 MB | 5 MB |
| Mobile MP4 | 0.5–1 MB | 2 MB |
| Poster WebP | 30–80 KB | 150 KB |
| **Total page** | **< 20 MB** | 35 MB |

---

## 9. Troubleshooting & Pro Tips

### Image-to-Video Specific Issues

| Problem | Fix |
|---------|-----|
| Veo ignores the start frame | Make sure you're uploading a 16:9 image. Crop if needed |
| Video starts fine but drifts away from style | Shorten prompt — Veo weighs early words more heavily |
| Motion is too fast | Add "extremely slow, glacial pace, half speed" to motion prompt |
| Motion is too subtle | Add "pronounced, clearly visible camera movement" |
| Start frame looks different in video | Upload as PNG (not JPEG) — compression artifacts confuse Veo |
| Colors shift mid-video | Add "maintain exact color palette throughout, no color drift" |

### General Veo Tips

| Tip | Details |
|-----|---------|
| **Generate 4+ variants** | AI video has variance; the best is rarely the first |
| **Watch at 0.25x speed** | This IS how users will experience it via scroll scrubbing |
| **Check first AND last frames** | Scroll 0% = frame 1, Scroll 100% = last frame — both are seen as stills |
| **The Sentinel overlay saves you** | CSS scanlines + grain mask minor AI artifacts — don't chase perfection |
| **If stuck after 3 tries** | Simplify the prompt, remove the most complex element, try again |

---

## Quick Reference Checklist

```
PHASE 1: IMAGES
[ ] Generate V1 Hero start frame          → hero_start.png
[ ] Generate V2 Problem start frame        → problem_start.png
[ ] Generate V3 Architecture start frame   → architecture_start.png
[ ] Generate V4 ML Models start frame      → ml-models_start.png
[ ] Generate V5 Competitive start frame    → competitive_start.png
[ ] Generate V6 Tech Stack start frame     → tech-stack_start.png
[ ] Generate V7 CTA Portal start frame     → cta-portal_start.png
[ ] (Optional) Generate End Frames for reference

PHASE 2: VIDEOS
[ ] Open Veo 2 → Set 16:9, 8 seconds
[ ] V1: Upload hero_start.png → Paste motion prompt → Generate 4 → Pick best
[ ] V2: Upload problem_start.png → Generate 4 → Pick best
[ ] V3: Upload architecture_start.png → Generate 4 → Pick best
[ ] V4: Upload ml-models_start.png → Generate 4 → Pick best
[ ] V5: Upload competitive_start.png → Generate 4 → Pick best
[ ] V6: Upload tech-stack_start.png → Generate 4 → Pick best
[ ] V7: Upload cta-portal_start.png → Generate 4 → Pick best

PHASE 3: POST-PRODUCTION
[ ] Run ffmpeg web optimization (Section 6, Step 1)
[ ] Run ffmpeg mobile variants (Section 6, Step 2)
[ ] Extract poster frames (Section 7)
[ ] Cohesion check (play all 7 back-to-back)
[ ] Color correction if needed (Section 6, Step 3)

PHASE 4: DEPLOY
[ ] Copy all files to frontend/public/videos/about/
[ ] Verify file sizes
[ ] pnpm dev → visit /about → see videos scrubbing on scroll
```
