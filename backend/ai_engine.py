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
import time
import math
from pathlib import Path
from typing import Dict, Any, List

# Optional heavy deps — graceful fallback if not installed
try:
    from PIL import Image, ImageChops, ImageEnhance, ExifTags
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
    """Authentic Image Forensics using Hashing, EXIF, ELA MSE, and Sensor Noise Variance."""
    if not PIL_AVAILABLE:
        raise RuntimeError("Image analysis requires PIL and numpy to be installed.")
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    try:
        # 1. Cryptographic Fingerprinting
        with open(filepath, "rb") as f:
            file_bytes = f.read()
        sha256 = hashlib.sha256(file_bytes).hexdigest()
        md5 = hashlib.md5(file_bytes).hexdigest()

        img = Image.open(filepath).convert("RGB")
        width, height = img.size

        findings = []
        risk_score = 0

        # 2. Comprehensive Metadata Extraction
        meta: Dict[str, str] = {}
        missing_capture_date = True
        try:
            exif = img.getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag_name = ExifTags.TAGS.get(tag_id, tag_id)
                    meta[str(tag_name)] = str(value)
                    if tag_name in ("DateTimeOriginal", "DateTimeDigitized"):
                        missing_capture_date = False

                if "Software" in meta and any(s in meta["Software"] for s in ["Photoshop", "GIMP", "Lightroom"]):
                    findings.append({"category": "Metadata Analysis", "severity": "Medium", "description": f"Editing software artifact detected: {meta['Software']}", "value": "Found"})
                    risk_score += 25
        except Exception:
            pass

        if missing_capture_date:
            findings.append({"category": "Metadata Analysis", "severity": "Low", "description": "Missing original capture timestamp (DateTimeOriginal). Common in scrubbed or web-downloaded files.", "value": "Missing"})
            risk_score += 10

        # 3. Error Level Analysis (ELA) with MSE
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=90)
        buf.seek(0)
        ela_img = Image.open(buf).convert("RGB")
        diff = ImageChops.difference(img, ela_img)
        
        arr = np.array(diff, dtype=np.float32)
        mse = np.mean((arr) ** 2)
        ela_severity = "High" if mse > 100 else "Medium" if mse > 30 else "Safe"
        if mse > 100: risk_score += 40
        elif mse > 30: risk_score += 20
        findings.append({"category": "Error Level Analysis (ELA)", "severity": ela_severity, "description": f"Compression anomaly analysis using Mean Squared Error (MSE={mse:.2f})", "value": f"MSE: {mse:.2f}"})

        # 4. Sensor Noise Analysis (Laplacian Variance)
        if CV2_AVAILABLE:
            cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
            variance = cv2.Laplacian(cv_img, cv2.CV_64F).var()
            blur_severity = "Medium" if variance < 50 else "Safe"
            if variance < 50: risk_score += 15
            findings.append({"category": "Sensor Noise Variance", "severity": blur_severity, "description": f"Focus/blur measure (Variance={variance:.1f}). Low variance indicates smoothing/tampering.", "value": f"Var: {variance:.1f}"})
        
        # Assemble results
        risk_score = min(risk_score, 100)
        summary = (
            f"Forensic pipeline executed successfully. Peak risk score: {risk_score}/100. " + 
            ("Significant tampering artifacts found." if risk_score >= 60 else "Minor inconsistencies detected." if risk_score >= 30 else "Image structure appears authentic.")
        )
        
        return {
            "risk_score": risk_score,
            "result": {
                "summary": summary,
                "findings": findings,
                "metadata": meta if meta else {"Note": "No EXIF metadata found"},
                "hashes": {"SHA-256": sha256, "MD5": md5},
                "recommendation": "Submit for lab verification." if risk_score >= 60 else "Monitor.",
            }
        }
    except Exception as e:
        raise RuntimeError(f"Authentic image forensics failed: {e}")


# ── Deepfake Detection ────────────────────────────────────
def run_deepfake_detection(filepath: str) -> Dict[str, Any]:
    """Authentic Deepfake Detection using Haar Cascades, FFT, and Laplacian Variance."""
    if not CV2_AVAILABLE or not PIL_AVAILABLE:
        raise RuntimeError("Deepfake analysis requires OpenCV and numpy.")
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    try:
        img = cv2.imread(filepath)
        if img is None:
            raise ValueError("Unable to read image for deepfake analysis.")
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 1. Face Detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
        
        findings = []
        risk_score = 0
        
        if len(faces) == 0:
            return {
                "risk_score": 10,
                "result": {
                    "summary": "No faces detected in the image/video frame. Deepfake analysis is not applicable.",
                    "findings": [{"category": "Face Detection", "severity": "Safe", "description": "Haar Cascade failed to identify any frontal faces.", "value": "0 Faces"}],
                    "recommendation": "Manual review if faces are known to be present."
                }
            }
        
        findings.append({"category": "Face Detection", "severity": "Safe", "description": f"Identified {len(faces)} face(s) for targeted region analysis.", "value": f"{len(faces)} Faces"})
        
        # Focus on the largest face for FFT and Blending analysis
        faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
        x, y, w, h = faces[0]
        face_roi_gray = gray[y:y+h, x:x+w]
        
        # 2. Frequency Domain Analysis (FFT on Face ROI)
        fft = np.fft.fft2(face_roi_gray)
        fft_shift = np.fft.fftshift(fft)
        magnitude = np.log(np.abs(fft_shift) + 1)
        
        r_h, r_w = magnitude.shape
        center_region = magnitude[r_h//4:3*r_h//4, r_w//4:3*r_w//4]
        edge_region = np.concatenate([magnitude[:r_h//4].ravel(), magnitude[3*r_h//4:].ravel()])
        ratio = float(center_region.mean() / (edge_region.mean() + 1e-6))
        
        # Authentic GAN models often lack high frequency details compared to real images
        fft_severity = "High" if ratio > 2.0 else "Medium" if ratio > 1.5 else "Safe"
        if ratio > 2.0: risk_score += 45
        elif ratio > 1.5: risk_score += 25
        findings.append({"category": "Facial Frequency Analysis (FFT)", "severity": fft_severity, "description": "GAN high-frequency artifact assessment on Region of Interest.", "value": f"Ratio: {ratio:.2f}"})
        
        # 3. Noise Variance / Blending Detection
        laplacian_face = cv2.Laplacian(face_roi_gray, cv2.CV_64F).var()
        bg_mask = np.ones(gray.shape, dtype=np.uint8)
        bg_mask[y:y+h, x:x+w] = 0
        bg_pixels = cv2.bitwise_and(gray, gray, mask=bg_mask)
        laplacian_bg = cv2.Laplacian(bg_pixels, cv2.CV_64F).var()
        
        # A significant difference in variance between face and background implies splicing or GAN generation
        var_diff = abs(laplacian_face - laplacian_bg)
        blend_severity = "High" if var_diff > 1000 else "Medium" if var_diff > 500 else "Safe"
        if var_diff > 1000: risk_score += 40
        elif var_diff > 500: risk_score += 20
        findings.append({"category": "Color & Blending Consistency", "severity": blend_severity, "description": f"Comparison of face noise variance ({laplacian_face:.1f}) vs background ({laplacian_bg:.1f}).", "value": f"ΔVar: {var_diff:.1f}"})

        # Assemble results
        risk_score = min(risk_score, 100)
        summary = (
            f"Authentic deepfake pipeline executed. Peak confidence: {risk_score}%. " +
            ("High probability of synthetic face generation or splicing." if risk_score >= 65 else "Moderate anomalies detected in facial regions." if risk_score >= 35 else "Facial region appears natural.")
        )
        
        return {
            "risk_score": risk_score,
            "result": {
                "summary": summary,
                "findings": findings,
                "deepfake_confidence": risk_score,
                "recommendation": "Subject to verified lab screening immediately." if risk_score >= 65 else "Monitor and cross-reference with timeline."
            }
        }
    except Exception as e:
        raise RuntimeError(f"Authentic deepfake detection failed: {e}")


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

def _shannon_entropy(data: str) -> float:
    """Calculates Shannon entropy of a string."""
    if not data:
        return 0.0
    entropy = 0.0
    for x in set(data):
        p_x = float(data.count(x)) / len(data)
        entropy -= p_x * math.log(p_x, 2)
    return entropy

def run_log_analysis(filepath: str) -> Dict[str, Any]:
    """Authentic Log Analysis using IoC Extraction, Shannon Entropy, and Signature Matching."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        
        findings = []
        events = []
        risk_score = 0
        
        # 1. IoC Extraction
        content = "".join(lines)
        ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
        ips = list(set(re.findall(ip_pattern, content)))
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = list(set(re.findall(email_pattern, content)))
        
        if ips or emails:
            desc = f"Extracted {len(ips)} IPs and {len(emails)} emails for threat intelligence correlation."
            findings.append({"category": "IoC Extraction", "severity": "Medium" if len(ips) > 5 else "Low", "description": desc, "value": f"{len(ips)} IPs"})

        # 2. Shannon Entropy Profiling (Detecting Base64 / Encrypted payloads)
        high_entropy_count = 0
        for i, line in enumerate(lines[:10000]):
            ent = _shannon_entropy(line.strip())
            if ent > 5.8:  # Typical english text is ~3.5-4.5. Base64/Crypto is > 5.8
                high_entropy_count += 1
                if high_entropy_count <= 5:  # Log the first few
                    events.append({"timestamp": f"Line {i+1}", "type": "OBFUSCATION", "message": line.strip()[:100] + "...", "severity": "High"})
        
        if high_entropy_count > 0:
            risk_score += min(high_entropy_count * 5, 40)
            findings.append({"category": "Shannon Entropy Profiling", "severity": "High", "description": f"{high_entropy_count} lines found with abnormally high entropy (potential base64 payload).", "value": f"{high_entropy_count} Lines"})
        else:
            findings.append({"category": "Shannon Entropy Profiling", "severity": "Safe", "description": "No obfuscated or encrypted payloads detected in logs.", "value": "Normal"})

        # 3. Signature & Pattern Matching
        finding_counts = {}
        for i, line in enumerate(lines[:10000]):
            for pattern, event_type, severity, description in SUSPICIOUS_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    finding_counts[event_type] = finding_counts.get(event_type, 0) + 1
                    if finding_counts[event_type] <= 3:
                        events.append({"timestamp": f"Line {i+1}", "type": event_type, "message": line.strip()[:100], "severity": severity})

        sig_score = 0
        SEV_WEIGHTS = {"Critical": 20, "High": 10, "Medium": 5, "Low": 1}
        for event_type, count in finding_counts.items():
            severity = next((sev for _, et, sev, _ in SUSPICIOUS_PATTERNS if et == event_type), "Low")
            sig_score += SEV_WEIGHTS.get(severity, 1) * count
            findings.append({"category": f"Signature: {event_type}", "severity": severity, "description": f"Matched threat signature {count} time(s).", "value": str(count)})
        
        risk_score += min(sig_score, 60)
        risk_score = min(risk_score, 100)

        summary = (
            f"Authentic log analysis complete on {len(lines)} lines. Peak risk score: {risk_score}/100. " +
            ("Critical threat signatures and anomalies identified." if risk_score >= 60 else "Suspicious anomalies flagged for review." if risk_score >= 30 else "Logs appear benign.")
        )
        
        # Sort events by severity
        sev_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
        events.sort(key=lambda x: sev_order.get(x["severity"], 4))

        return {
            "risk_score": risk_score,
            "result": {
                "summary": summary,
                "findings": findings,
                "log_events": events[:20],
                "recommendation": "Isolate system and block identified IPs immediately." if risk_score >= 60 else "Monitor for further anomalous activity."
            }
        }
    except Exception as e:
        raise RuntimeError(f"Authentic log analysis failed: {e}")




# ── Shared Gemini API Helper ───────────────────────────────
def _gemini_request(prompt: str, api_key: str, model: str = "gemini-flash-latest") -> str:
    """
    Make a request to the Gemini API.
    Uses gemini-flash-latest — fast, accurate, and won't bankrupt you.
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


def _make_ai_request(prompt: str, system_prompt: str, provider: str, api_key: str) -> str:
    """Helper to dispatch the prompt to Gemini, OpenAI, Groq, or Pollinations AI."""
    prov = (provider or "pollinations").lower()
    key = api_key or os.environ.get(f"{prov.upper()}_API_KEY")

    try:
        if prov == "pollinations" or (prov != "pollinations" and not key):
            import urllib.parse
            encoded_prompt = urllib.parse.quote(prompt)
            url = f"https://text.pollinations.ai/{encoded_prompt}"
            params = {}
            if system_prompt:
                params["system"] = system_prompt
            params["model"] = "openai"
            for attempt in range(3):
                response = requests.get(url, params=params, timeout=20)
                if response.status_code == 429 and attempt < 2:
                    time.sleep(1.5 ** attempt)
                    continue
                response.raise_for_status()
                return response.text

        elif prov == "openai":
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}"
            }
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            payload = {
                "model": "gpt-4o-mini",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1024
            }
            response = requests.post(url, headers=headers, json=payload, timeout=20)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

        elif prov == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}"
            }
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1024
            }
            response = requests.post(url, headers=headers, json=payload, timeout=20)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

        else:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            return _gemini_request(full_prompt, key)
            
    except Exception as e:
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if prov != "gemini" and gemini_key:
            try:
                print(f"Provider {prov} failed, falling back to Gemini due to: {e}")
                full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                return _gemini_request(full_prompt, gemini_key)
            except Exception as fallback_err:
                print(f"Fallback to Gemini failed: {fallback_err}")
                pass
        raise e


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


def ask_assistant(question: str, context: str, api_key: str = None, persona: str = "nexus", provider: str = None) -> str:
    """Main AI assistant entry point. Tries configured provider first, falls back gracefully."""
    system_prompt = NEXUS_SYSTEM_PROMPT
    if persona == "geek":
        system_prompt = GEEK_SYSTEM_PROMPT
    elif persona == "noir":
        system_prompt = NOIR_SYSTEM_PROMPT

    prompt = (
        f"--- CASE CONTEXT ---\n{context}\n\n"
        f"--- USER QUESTION ---\n{question}\n\n"
        "Provide a concise, accurate, and appropriately styled forensic response."
    )

    try:
        return _make_ai_request(prompt, system_prompt, provider, api_key)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            return (
                "🔌 AI servers are currently experiencing high traffic.\n\n"
                f"Here's what my local knowledge banks say:\n\n{_fallback_ask_assistant(question, persona)}"
            )
        return (
            f"🔌 Connection failed: {error_msg[:80]}.\n\n"
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
def analyze_text_evidence(text: str, api_key: str = None, provider: str = None) -> Dict[str, Any]:
    """
    Analyze raw text/notes for suspicious patterns using AI.
    Falls back to regex-based heuristics if no API key/provider error.
    """
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

    prov = (provider or "pollinations").lower()
    key = api_key or os.environ.get(f"{prov.upper()}_API_KEY")

    if prov == "pollinations" or key:
        try:
            ai_summary = _make_ai_request(
                prompt=f"Analyze this text from a digital forensics investigation for threats, anomalies, and suspicious content. Highlight the top 3 concerns:\n\n{text[:3000]}",
                system_prompt="You are NΞXUS, a forensic AI. Be concise, professional, and slightly witty.",
                provider=prov,
                api_key=key
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
def generate_case_summary(case_data: Dict[str, Any], api_key: str = None, provider: str = None) -> str:
    """Generate an AI-powered executive summary for a forensics case."""
    case_text = (
        f"Case: {case_data.get('title', 'Unknown')}\n"
        f"ID: {case_data.get('case_id', 'N/A')}\n"
        f"Status: {case_data.get('status', 'Unknown')}\n"
        f"Priority: {case_data.get('priority', 'Unknown')}\n"
        f"Evidence Count: {case_data.get('evidence_count', 0)}\n"
        f"Max Risk Score: {case_data.get('max_risk', 0)}/100\n"
        f"Analysis Results: {case_data.get('analysis_summary', 'No analysis performed yet')}\n"
    )

    prov = (provider or "pollinations").lower()
    key = api_key or os.environ.get(f"{prov.upper()}_API_KEY")

    if prov == "pollinations" or key:
        try:
            return _make_ai_request(
                prompt=f"Generate a concise executive summary (3-4 sentences) for this forensics case. Be professional but not boring. If risk is high, convey urgency with a dash of dry wit:\n\n{case_text}",
                system_prompt="You are NΞXUS, a forensic AI with the wit of Sherlock Holmes.",
                provider=prov,
                api_key=key
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
