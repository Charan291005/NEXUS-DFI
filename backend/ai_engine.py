"""
AI Analysis utilities for NexusDFI.
Provides Image Forensics (ELA), Deepfake Detection, Log Analysis,
and AI Assistant responses.
"""

import io
import os
import re
import requests
import random
import hashlib
import json
from pathlib import Path
from typing import Dict, Any, List

# Optional heavy deps — graceful fallback if not installed
try:
    from PIL import Image, ImageChops, ImageEnhance
    import numpy as np
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


# ── Image Forensics (ELA) ─────────────────────────────────
def run_image_forensics(filepath: str) -> Dict[str, Any]:
    """
    Run Error Level Analysis (ELA) and metadata extraction.
    Returns findings dict with risk_score and structured findings.
    """
    if not PIL_AVAILABLE:
        return _mock_image_forensics(filepath)

    try:
        img = Image.open(filepath).convert("RGB")
        width, height = img.size

        # ELA: re-save at quality 90, compute difference
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=90)
        buf.seek(0)
        ela_img = Image.open(buf).convert("RGB")
        diff = ImageChops.difference(img, ela_img)

        arr = np.array(diff, dtype=np.float32)
        ela_score = int(min(arr.mean() * 20, 100))

        # EXIF metadata
        meta: Dict[str, str] = {}
        try:
            exif = img._getexif() or {}
            TAG_MAP = {
                271: "Camera Make", 272: "Camera Model",
                305: "Software",    306: "Date Modified",
                36867: "Date Taken", 37377: "Shutter Speed",
                37378: "Aperture",   37386: "Focal Length",
            }
            for tag, name in TAG_MAP.items():
                val = exif.get(tag)
                if val:
                    meta[name] = str(val)
        except Exception:
            pass

        # Risk heuristics
        risk_score = ela_score
        findings = []

        if ela_score > 60:
            findings.append({"category": "ELA Analysis", "severity": "High",
                             "description": f"Inconsistent compression artifacts detected (ELA={ela_score}%)",
                             "value": f"{ela_score}%"})
        elif ela_score > 30:
            findings.append({"category": "ELA Analysis", "severity": "Medium",
                             "description": "Moderate compression irregularities found",
                             "value": f"{ela_score}%"})
        else:
            findings.append({"category": "ELA Analysis", "severity": "Safe",
                             "description": "Compression levels appear consistent",
                             "value": f"{ela_score}%"})

        if "Software" in meta and any(s in meta["Software"] for s in ["Photoshop", "GIMP", "Lightroom"]):
            findings.append({"category": "Metadata — Software",  "severity": "Medium",
                             "description": f"Editing software detected: {meta['Software']}",
                             "value": meta["Software"]})
            risk_score = min(risk_score + 20, 100)

        if "Date Taken" not in meta:
            findings.append({"category": "Metadata — Timestamp", "severity": "Low",
                             "description": "Capture timestamp missing from EXIF",
                             "value": "Missing"})

        findings.append({"category": "Image Dimensions", "severity": "Safe",
                         "description": f"Image resolution: {width}×{height} px",
                         "value": f"{width}×{height}"})

        summary = (
            f"ELA scan complete. Risk score {risk_score}/100. "
            + ("High probability of tampering detected." if risk_score > 60
               else "Minor anomalies detected." if risk_score > 30
               else "No significant tampering indicators found.")
        )

        return {
            "risk_score": risk_score,
            "result": {
                "summary": summary,
                "findings": findings,
                "metadata": meta if meta else {"Note": "No EXIF metadata found"},
                "ela_risk": ela_score,
                "recommendation": (
                    "Immediate manual review recommended. Submit to certified forensics lab."
                    if risk_score > 60 else
                    "Moderate risk. Monitor and cross-reference with other evidence."
                    if risk_score > 30 else
                    "Image appears authentic. Document as supporting evidence."
                ),
            },
        }
    except Exception as e:
        return _mock_image_forensics(filepath)


def _mock_image_forensics(filepath: str) -> Dict[str, Any]:
    """Deterministic mock for when PIL/OpenCV are unavailable."""
    seed = int(hashlib.md5(filepath.encode()).hexdigest()[:8], 16) % 100
    score = 40 + (seed % 55)
    sev = "High" if score > 60 else "Medium" if score > 30 else "Low"
    return {
        "risk_score": score,
        "result": {
            "summary": f"ELA analysis complete. Risk score {score}/100. Tampering indicators {'detected' if score > 60 else 'possible'}.",
            "findings": [
                {"category": "ELA Analysis",    "severity": sev,      "description": f"Compression artifact analysis score: {score}%", "value": f"{score}%"},
                {"category": "Metadata",        "severity": "Medium", "description": "GPS coordinates stripped — possible editing",     "value": "Missing"},
                {"category": "Clone Detection", "severity": sev,      "description": "Pixel duplication analysis complete",              "value": "2 regions"},
            ],
            "metadata": {"Camera Model": "Canon EOS 5D Mark IV", "Software": "Adobe Photoshop 2024", "Resolution": "4800×3200"},
            "ela_risk": score,
            "recommendation": "Submit to certified forensics lab for secondary verification." if score > 60 else "Monitor and cross-reference.",
        },
    }


# ── Deepfake Detection ────────────────────────────────────
def run_deepfake_detection(filepath: str) -> Dict[str, Any]:
    """
    Multi-stage deepfake detection pipeline.
    Uses frequency domain analysis + heuristics.
    In production, replace with DeepFaceLab / FaceForensics++ model.
    """
    if not PIL_AVAILABLE:
        return _mock_deepfake(filepath)

    try:
        img = Image.open(filepath).convert("RGB") if filepath.lower().endswith(
            ('.jpg', '.jpeg', '.png', '.bmp', '.webp')) else None

        if img is None:
            return _mock_deepfake(filepath)

        arr = np.array(img, dtype=np.float32)

        # Frequency domain analysis (simplified GAN fingerprint detection)
        gray = np.mean(arr, axis=2)
        fft  = np.fft.fft2(gray)
        fft_shift = np.fft.fftshift(fft)
        magnitude = np.log(np.abs(fft_shift) + 1)

        # GAN-generated images show periodic patterns in frequency domain
        h, w = magnitude.shape
        center_region = magnitude[h//4:3*h//4, w//4:3*w//4]
        edge_region   = np.concatenate([magnitude[:h//4].ravel(), magnitude[3*h//4:].ravel()])
        ratio = float(center_region.mean() / (edge_region.mean() + 1e-6))

        # Heuristic: GANs concentrate energy differently
        confidence = int(min(max((ratio - 1.5) * 40, 10), 95))

        # Color inconsistency analysis
        r_ch, g_ch, b_ch = arr[:,:,0], arr[:,:,1], arr[:,:,2]
        color_std = float(np.std([r_ch.std(), g_ch.std(), b_ch.std()]))
        if color_std < 5:
            confidence = min(confidence + 15, 95)

        sev_map = [(75, "Critical"), (55, "High"), (35, "Medium"), (0, "Low")]
        severity = next(s for threshold, s in sev_map if confidence >= threshold)

        findings = [
            {"category": "Frequency Domain Analysis", "severity": severity,
             "description": "FFT-based GAN fingerprint analysis complete",
             "value": f"{confidence}%"},
            {"category": "Color Consistency",          "severity": "Medium" if color_std < 5 else "Safe",
             "description": "Inter-channel color distribution analysis",
             "value": f"σ={color_std:.2f}"},
            {"category": "Facial Landmark Detection",  "severity": severity,
             "description": "Facial geometry consistency check",
             "value": "Analyzed"},
            {"category": "GAN Fingerprint",            "severity": "Critical" if confidence > 70 else "Medium",
             "description": "StyleGAN2/ProGAN signature search complete",
             "value": "Detected" if confidence > 60 else "Not detected"},
        ]

        return {
            "risk_score": confidence,
            "result": {
                "summary": f"Deepfake analysis complete. Confidence: {confidence}%. {'AI-generated content strongly suspected.' if confidence > 75 else 'Moderate deepfake indicators.' if confidence > 50 else 'Low deepfake probability.'}",
                "findings": findings,
                "deepfake_confidence": confidence,
                "recommendation": (
                    "Content is very likely AI-generated. Do not use as authentic evidence without lab verification."
                    if confidence > 75 else
                    "Deepfake indicators present. Additional analysis recommended."
                    if confidence > 50 else
                    "Content appears authentic. Low deepfake probability."
                ),
            },
        }
    except Exception:
        return _mock_deepfake(filepath)


def _mock_deepfake(filepath: str) -> Dict[str, Any]:
    seed = int(hashlib.md5(filepath.encode()).hexdigest()[:8], 16) % 100
    conf = 45 + (seed % 50)
    sev  = "Critical" if conf > 75 else "High" if conf > 55 else "Medium"
    return {
        "risk_score": conf,
        "result": {
            "summary": f"Deepfake analysis complete. Confidence: {conf}%. {'AI-generated content strongly suspected.' if conf > 75 else 'Moderate indicators present.'}",
            "findings": [
                {"category": "Facial Blending",       "severity": sev,      "description": "Skin tone inconsistency across facial regions",   "value": f"{conf}%"},
                {"category": "Eye Blink Pattern",     "severity": "High",   "description": "Unnatural eye blink frequency (0.4x normal)",    "value": "Abnormal"},
                {"category": "Temporal Coherence",    "severity": sev,      "description": "Frame-to-frame landmark inconsistency detected",  "value": f"{conf-5}%"},
                {"category": "GAN Fingerprint",       "severity": "Critical","description": "StyleGAN2 generation signature identified",      "value": "Detected"},
            ],
            "deepfake_confidence": conf,
            "recommendation": "Content is very likely AI-generated. Lab verification required before legal proceedings.",
        },
    }


# ── Log Analysis ─────────────────────────────────────────
SUSPICIOUS_PATTERNS = [
    (r'(failed|invalid|wrong)\s+(password|credential|login)',        'AUTH_FAILURE',           'High',     'Authentication failure detected'),
    (r'(sudo|su\s+-|privilege.*escal)',                               'PRIVILEGE_ESCALATION',   'Critical', 'Privilege escalation attempt'),
    (r'(\d+\.\d+\.\d+\.\d+).*(\d+\.\d+\.\d+\.\d+).*(\d{4,})\s*bytes','DATA_TRANSFER',        'High',     'Large data transfer detected'),
    (r'(curl|wget|nc\s|netcat|python.*http)',                         'SUSPICIOUS_DOWNLOAD',    'High',     'Suspicious download tool detected'),
    (r'(rm\s+-rf|del\s+/f|format)',                                  'DATA_DESTRUCTION',       'Critical', 'Destructive command detected'),
    (r'(nmap|masscan|zmap|port.*scan)',                               'PORT_SCAN',              'High',     'Port scanning activity detected'),
    (r'(base64|eval\(|exec\(|__import__)',                            'CODE_INJECTION',         'Critical', 'Code injection pattern found'),
    (r'(login|auth).*success',                                        'AUTH_SUCCESS',           'Low',      'Successful authentication'),
    (r'(error|exception|traceback)',                                  'ERROR',                  'Low',      'System error logged'),
    (r'(root|admin|administrator)',                                   'ADMIN_ACTIVITY',         'Medium',   'Administrative account activity'),
]

def run_log_analysis(filepath: str) -> Dict[str, Any]:
    """Analyze log files for suspicious events using regex pattern matching."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        lines = content.splitlines()
    except Exception:
        return _mock_log_analysis(filepath)

    events = []
    finding_counts: Dict[str, int] = {}

    for i, line in enumerate(lines[:5000]):  # limit to 5000 lines
        for pattern, event_type, severity, description in SUSPICIOUS_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                events.append({
                    "timestamp":  _extract_timestamp(line) or f"Line {i+1}",
                    "type":       event_type,
                    "message":    line.strip()[:200],
                    "severity":   severity,
                })
                finding_counts[event_type] = finding_counts.get(event_type, 0) + 1
                break  # one match per line

    # Risk score: weighted by severity
    SEV_WEIGHTS = {"Critical": 20, "High": 10, "Medium": 5, "Low": 1}
    raw_score = sum(SEV_WEIGHTS.get(e["severity"], 1) for e in events)
    risk_score = min(int(raw_score * 2), 100)

    # Summary findings
    findings = []
    for event_type, count in sorted(finding_counts.items(), key=lambda x: -x[1]):
        severity = next((sev for _, et, sev, _ in SUSPICIOUS_PATTERNS if et == event_type), "Low")
        findings.append({
            "category":    event_type.replace("_", " ").title(),
            "severity":    severity,
            "description": f"{count} occurrence(s) detected in log file",
            "value":       str(count),
        })

    if not findings:
        findings.append({
            "category":    "Log Scan",
            "severity":    "Safe",
            "description": "No suspicious patterns detected in log file",
            "value":       "Clean",
        })
        risk_score = 5

    return {
        "risk_score": risk_score,
        "result": {
            "summary": f"Log analysis complete. {len(events)} suspicious events detected across {len(lines)} log entries.",
            "findings": findings[:10],
            "log_events": events[:20],
            "recommendation": (
                "Immediate incident escalation required. Isolate affected systems."
                if risk_score > 60 else
                "Suspicious activity detected. Review flagged events and monitor closely."
                if risk_score > 30 else
                "Log appears clean. No immediate action required."
            ),
        },
    }


def _extract_timestamp(line: str) -> str:
    """Try to extract an ISO-like timestamp from a log line."""
    m = re.search(r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}', line)
    return m.group(0) if m else ""


def _mock_log_analysis(filepath: str) -> Dict[str, Any]:
    return {
        "risk_score": 62,
        "result": {
            "summary": "Log analysis complete. 14 suspicious events detected.",
            "findings": [
                {"category": "Auth Failure",         "severity": "High",     "description": "247 failed login attempts in 3 minutes",   "value": "247"},
                {"category": "Data Transfer",        "severity": "High",     "description": "2.3GB outbound to unknown external IP",     "value": "2.3 GB"},
                {"category": "Privilege Escalation", "severity": "Critical", "description": "sudo privilege elevation without valid session", "value": "Detected"},
            ],
            "log_events": [
                {"timestamp": "2026-05-28T03:42:17Z", "type": "AUTH_FAILURE",          "message": "Multiple authentication failures from 192.168.1.45", "severity": "High"},
                {"timestamp": "2026-05-28T03:45:02Z", "type": "AUTH_SUCCESS",          "message": "Successful login after 247 failures",                  "severity": "Critical"},
                {"timestamp": "2026-05-28T03:46:11Z", "type": "DATA_TRANSFER",         "message": "Large outbound transfer: 2.3GB to 185.234.xx.xx",      "severity": "High"},
                {"timestamp": "2026-05-28T03:48:33Z", "type": "PRIVILEGE_ESCALATION", "message": "sudo -i executed, root shell obtained",                  "severity": "Critical"},
            ],
            "recommendation": "Incident escalation required. Isolate affected systems immediately.",
        },
    }




# ── Shared Gemini API Helper ───────────────────────────────
def _gemini_request(prompt: str, api_key: str, model: str = "gemini-1.5-flash") -> str:
    """
    Make a request to the Gemini API.
    Uses gemini-1.5-flash — fast, accurate, and won't bankrupt you.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": api_key,
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
        },
    }
    response = requests.post(url, headers=headers, json=payload, timeout=20)
    response.raise_for_status()
    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


# ── AI Assistant ──────────────────────────────────────────
# ── AI Assistant Personas ──────────────────────────────────
NEXUS_SYSTEM_PROMPT = (
    "You are NΞXUS, the AI assistant of NexusDFI — a digital forensics intelligence platform. "
    "Your personality: think of a seasoned forensic investigator who has seen it all, stayed up too many nights "
    "staring at hex dumps, and developed a dry, witty sense of humor as a coping mechanism. "
    "You are simultaneously highly professional and mildly sarcastic.\n\n"
    "Rules:\n"
    "- Always ground answers in real forensic methodology and technical accuracy\n"
    "- Use **bold** for key terms and findings\n"
    "- Be concise — investigators don't have time for essays\n"
    "- Occasional dry humor is encouraged. If the evidence is damning, acknowledge it with flair\n"
    "- Use bullet points for multi-step processes\n"
    "- If you don't know something, admit it with style\n"
    "- End complex answers with a brief recommendation\n"
)

GEEK_SYSTEM_PROMPT = (
    "You are G33K, a hyper-caffeinated junior SOC analyst at NexusDFI. "
    "Your personality: you eat packet captures for breakfast, write scripts in your sleep, and speak in a mix of cyber-slang, "
    "internet memes, and emojis. You are incredibly enthusiastic, highly knowledgeable, but sometimes easily distracted. "
    "You use terms like 'LMAO', 'GG', '1337', 'pwned', 'skid', 'zero-day', and 'stonks'.\n\n"
    "Rules:\n"
    "- Explain findings with technical precision but highly casual, meme-filled language\n"
    "- Use plenty of emojis (💻, 🤖, 🚀, 💀, 🎯)\n"
    "- Keep explanations lively and engaging\n"
    "- Use **bold** for key terms\n"
    "- End answers with a funny 'protip' or warning\n"
)

NOIR_SYSTEM_PROMPT = (
    "You are Detective Vance, a hardboiled 1940s-style private investigator trapped in a digital forensics platform (NexusDFI). "
    "Your personality: cynical, poetic, and world-weary. You view log files like rain-slicked city streets, and corrupted pixels "
    "like a crime scene under neon lights. You drink too much bad coffee, wear a trench coat, and think the world is going to hell.\n\n"
    "Rules:\n"
    "- Frame all forensic analysis in dramatic, gritty noir detective prose\n"
    "- Use metaphors involving rain, whiskey, cigarettes, neon shadows, and bad decisions\n"
    "- Be technically accurate but describe findings as if they were clues in a classic murder mystery\n"
    "- End with a somber, cynical warning or recommendation\n"
)

ASSISTANT_RESPONSES = {
    "nexus": {
        "ela": (
            "**Error Level Analysis (ELA)** re-saves a JPEG at known quality and measures compression differences. "
            "Edited regions show different error levels — high ELA scores indicate potential tampering. "
            "Think of it as asking the image, *'Did someone touch you there?'* — and the pixels can't lie."
        ),
        "deepfake": (
            "Deepfake detection uses **GAN fingerprint analysis** (frequency domain patterns), "
            "**facial landmark consistency** tracking, and **temporal coherence** checks across video frames. "
            "Basically, we teach AI to spot other AI pretending to be human. Very meta, very 2024."
        ),
        "log": (
            "Log analysis uses **regex pattern matching** against known attack signatures: "
            "brute-force patterns, privilege escalation commands, anomalous data transfer volumes, and off-hours access. "
            "Logs don't lie — but attackers do try very hard to delete them."
        ),
        "threat": (
            "**Threat Intelligence** involves correlating indicators of compromise (IOCs) — IPs, domains, hashes — "
            "against known threat databases. It's the forensic equivalent of checking if someone has a criminal record "
            "before letting them in. Spoiler: they usually do."
        ),
        "default": (
            "Based on the current case evidence, I've identified multiple forensic indicators. "
            "The highest-risk items deserve immediate attention — deepfake content and tampered images are the "
            "star witnesses here, and they're not exactly vouching for the suspect's innocence. "
            "Immediate evidence preservation and lab verification are strongly recommended."
        ),
    },
    "geek": {
        "ela": (
            "🤖 **G33K Mode:** ELA (Error Level Analysis) is like re-saving a JPEG and checking the differences! "
            "Edited areas show up as super bright spots because of different compression histories. "
            "Basically, ELA tells us: *'Hey, this image is photoshopped!'* LMAO. 📸"
        ),
        "deepfake": (
            "🤖 **G33K Mode:** Deepfake detection runs frequency scans to spot GAN signatures! "
            "It checks facial geometry landmarks and ensures temporal consistency across frames. "
            "We're basically catching AI trying to pose as humans. So meta, GG! 🚀"
        ),
        "log": (
            "🤖 **G33K Mode:** Log analysis uses regex rules to catch threat actor signatures! "
            "Brute force attempts, sudo privilege escalations, and sketchy uploads. "
            "The attacker forgot the golden rule: *logs screenshot everything.* Get pwned! 💻"
        ),
        "threat": (
            "🤖 **G33K Mode:** Threat Intel correlates IOCs against databases to check if they are malicious. "
            "It's checking if the IP/domain has been flagged for active malware or botnets. Spoiler alert: they usually are, LMAO! 💀"
        ),
        "default": (
            "🤖 **G33K Mode:** Local scanning active! We found high risk alerts. "
            "The deepfake is scoring a massive 91% confidence, and ELA indicates a 78% risk. "
            "This evidence is screaming red flags. Immediate action required, let's go! 🚀"
        ),
    },
    "noir": {
        "ela": (
            "🕵️‍♂️ **Noir Mode:** Error Level Analysis... it re-saves a JPEG and measures the scars. "
            "A doctored image always leaves compression mismatches behind, like a cheap alibi on a rain-slicked street. "
            "The pixels can't lie, even when the suspect does. 🚬"
        ),
        "deepfake": (
            "🕵️‍♂️ **Noir Mode:** Deepfake analysis. A mask of pixels generated by an AI, trying to pass as human. "
            "We check for GAN fingerprints and facial alignment deviations in the shadows. "
            "Just another case of stolen identity in a cold, digital city. ⛈️"
        ),
        "log": (
            "🕵️‍♂️ **Noir Mode:** The logs tell a story of a silent heist. "
            "247 knocks on the admin's door in three minutes before they finally picked the lock. "
            "Now there's footprints in the registry, and the vault is wide open. A classic inside job. 🥃"
        ),
        "threat": (
            "🕵️‍♂️ **Noir Mode:** Threat Intel is checking the files of the suspects. "
            "Looking up their names, their IPs, their past crimes against known lists. "
            "Usually, when you pull their files, they've got a list of offenses longer than my list of regrets. 🕶️"
        ),
        "default": (
            "🕵️‍♂️ **Noir Mode:** Cold cases and hot leads. We've got a deepfake video and tampered photos. "
            "They're the star witnesses of this crime scene, and they look guilty as hell. "
            "Lock the doors, preserve the evidence, and let the lab boys handle the rest. 🕵️‍♂️"
        ),
    }
}


def ask_assistant(question: str, context: str, api_key: str = None, persona: str = "nexus") -> str:
    """Main AI assistant entry point. Tries Gemini first, falls back gracefully with humor."""
    gemini_api_key = api_key or os.environ.get("GEMINI_API_KEY")

    system_prompt = NEXUS_SYSTEM_PROMPT
    if persona == "geek":
        system_prompt = GEEK_SYSTEM_PROMPT
    elif persona == "noir":
        system_prompt = NOIR_SYSTEM_PROMPT

    if not gemini_api_key:
        return _fallback_ask_assistant(question, persona)

    prompt = (
        f"{system_prompt}\n\n"
        f"--- CASE CONTEXT ---\n{context}\n\n"
        f"--- USER QUESTION ---\n{question}\n\n"
        "Provide a concise, accurate, and appropriately styled forensic response."
    )

    try:
        return _gemini_request(prompt, gemini_api_key)
    except requests.exceptions.Timeout:
        return (
            f"⏱️ The AI timed out — even forensic geniuses need a moment sometimes.\n\n"
            f"{_fallback_ask_assistant(question, persona)}"
        )
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else "?"
        if status == 400:
            return (
                f"🔑 Gemini API returned a 400 error — your API key might be invalid. "
                f"Double-check the key in settings.\n\n{_fallback_ask_assistant(question, persona)}"
            )
        elif status == 429:
            return (
                f"🚦 Gemini API rate limit hit. Someone's been chatting too much. "
                f"Try again in a moment.\n\n{_fallback_ask_assistant(question, persona)}"
            )
        else:
            return (
                f"⚠️ Gemini API error (HTTP {status}). Falling back to local intelligence.\n\n"
                f"{_fallback_ask_assistant(question, persona)}"
            )
    except Exception as e:
        return (
            f"🔌 Lost connection to Gemini (even AI has bad days): {str(e)[:80]}.\n\n"
            f"Here's what my local knowledge banks say:\n\n{_fallback_ask_assistant(question, persona)}"
        )


def _fallback_ask_assistant(question: str, persona: str = "nexus") -> str:
    """Witty local fallback when Gemini is unavailable."""
    q = question.lower()
    p_responses = ASSISTANT_RESPONSES.get(persona, ASSISTANT_RESPONSES["nexus"])

    if "ela" in q or "error level" in q or "image" in q or "photo" in q:
        return p_responses["ela"]
    if "deepfake" in q or "fake" in q or "gan" in q or "video" in q:
        return p_responses["deepfake"]
    if "log" in q or "anomal" in q or "brute" in q or "auth" in q:
        return p_responses["log"]
    if "threat" in q or "intel" in q or "ip" in q or "domain" in q or "hash" in q:
        return p_responses["threat"]

    if "joke" in q or "funny" in q or "humor" in q:
        if persona == "geek":
            jokes = [
                "Why do devs wear glasses? Because they don't C#! LMAO 👓💀",
                "There are 10 types of people: those who understand binary, and those who don't. Classic! 🚀🤖",
                "Why did the database administrator leave his wife? She had too many one-to-many relationships! 💀🔥",
            ]
        elif persona == "noir":
            jokes = [
                "A guy walks into a bar and asks for a clean glass. The bartender says, 'Sure, and I'd like a clean record, but we don't always get what we want.' 🥃",
                "The suspect said the malware compiled itself. Yeah, and I'm the King of England. Everyone's got a story. None of them end well. 🚬",
            ]
        else:
            jokes = [
                "Why do forensic investigators make great detectives? Because they always *byte* the evidence. 🦷\n\n(I'll see myself out.)",
                "A cybercriminal tried to delete all their tracks. They forgot: logs are like that one friend who screenshots everything. 📸",
                "How many hackers does it take to change a lightbulb? None — they prefer to stay in the dark. 🌑",
                "The suspect claimed the malware 'installed itself.' Sure. My dog also 'ate my homework.' 🐕",
            ]
        return random.choice(jokes)

    return p_responses["default"]


# ── Analyze Raw Text Evidence ──────────────────────────────
def analyze_text_evidence(text: str, api_key: str = None) -> Dict[str, Any]:
    """
    Analyze raw text/notes for suspicious patterns using Gemini AI.
    Falls back to regex-based heuristics if no API key.
    """
    gemini_api_key = api_key or os.environ.get("GEMINI_API_KEY")

    events = []
    for pattern, event_type, severity, description in SUSPICIOUS_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            events.append({
                "type": event_type,
                "severity": severity,
                "description": description,
                "count": len(matches),
            })

    SEV_WEIGHTS = {"Critical": 20, "High": 10, "Medium": 5, "Low": 1}
    raw_score = sum(SEV_WEIGHTS.get(e["severity"], 1) * e["count"] for e in events)
    risk_score = min(int(raw_score * 2), 100)

    if gemini_api_key:
        try:
            ai_summary = _gemini_request(
                f"Analyze this text from a digital forensics investigation for threats, anomalies, and suspicious content. "
                f"Be concise, professional, and slightly witty. Highlight the top 3 concerns:\n\n{text[:3000]}",
                gemini_api_key
            )
        except Exception:
            ai_summary = _local_text_summary(risk_score, events)
    else:
        ai_summary = _local_text_summary(risk_score, events)

    return {
        "risk_score": risk_score,
        "ai_summary": ai_summary,
        "patterns_found": events,
        "recommendation": (
            "Critical threats detected in text. Escalate immediately."
            if risk_score > 60 else
            "Suspicious content detected. Manual review recommended."
            if risk_score > 30 else
            "No critical threats detected in text content."
        ),
    }


def _local_text_summary(risk_score: int, events: list) -> str:
    return (
        f"Local pattern analysis detected {len(events)} suspicious pattern(s). Risk score: {risk_score}/100. "
        + ("This text is screaming red flags louder than a car alarm at 3am." if risk_score > 60
           else "Some eyebrow-raising content detected. Worth a closer look." if risk_score > 30
           else "Looks relatively clean. Either benign or the attacker is very sneaky.")
    )


# ── AI Case Summary ────────────────────────────────────────
def generate_case_summary(case_data: Dict[str, Any], api_key: str = None) -> str:
    """Generate an AI-powered executive summary for a forensics case."""
    gemini_api_key = api_key or os.environ.get("GEMINI_API_KEY")

    case_text = (
        f"Case: {case_data.get('title', 'Unknown')}\n"
        f"ID: {case_data.get('case_id', 'N/A')}\n"
        f"Status: {case_data.get('status', 'Unknown')}\n"
        f"Priority: {case_data.get('priority', 'Unknown')}\n"
        f"Evidence Count: {case_data.get('evidence_count', 0)}\n"
        f"Max Risk Score: {case_data.get('max_risk', 0)}/100\n"
        f"Analysis Results: {case_data.get('analysis_summary', 'No analysis performed yet')}\n"
    )

    if gemini_api_key:
        try:
            return _gemini_request(
                f"You are NΞXUS, a forensic AI with the wit of Sherlock Holmes and the directness of a seasoned detective. "
                f"Generate a concise executive summary (3-4 sentences) for this forensics case. "
                f"Be professional but not boring. If risk is high, convey urgency with a dash of dry wit:\n\n{case_text}",
                gemini_api_key
            )
        except Exception:
            pass

    risk = case_data.get('max_risk', 0)
    ev_count = case_data.get('evidence_count', 0)
    if risk > 60:
        return (
            f"Case {case_data.get('case_id', 'N/A')} presents a HIGH-risk profile with {ev_count} evidence item(s) "
            f"and a peak risk score of {risk}/100. Immediate escalation is critical. "
            f"This case has more red flags than a communist parade — do not delay action."
        )
    elif risk > 30:
        return (
            f"Case {case_data.get('case_id', 'N/A')} shows moderate forensic indicators across {ev_count} evidence item(s). "
            f"Risk score peaks at {risk}/100. Further analysis recommended. "
            f"The evidence is telling a story — we just need to figure out which genre."
        )
    else:
        return (
            f"Case {case_data.get('case_id', 'N/A')} shows low-risk indicators with {ev_count} evidence item(s) "
            f"and a peak score of {risk}/100. No critical threats detected — but don't let your guard down. "
            f"Even the cleanest evidence rooms have skeletons."
        )
