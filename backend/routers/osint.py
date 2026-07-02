from fastapi import APIRouter, HTTPException
import requests
import re
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()

class ThreatPattern(BaseModel):
    type: str
    severity: str
    description: str
    count: int

class OsintResult(BaseModel):
    indicator: str
    type: str
    risk_score: int
    ai_summary: str
    patterns_found: List[ThreatPattern]
    recommendation: str
    raw_data: Optional[Dict[str, Any]] = None

def detect_type(indicator: str) -> str:
    indicator = indicator.strip()
    if re.match(r"^(\d{1,3}\.){3}\d{1,3}$", indicator):
        return "IPv4"
    if re.match(r"^[0-9a-f:]+$", indicator, re.IGNORECASE) and ":" in indicator:
        return "IPv6"
    if re.match(r"^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$", indicator, re.IGNORECASE):
        return "domain"
    if re.match(r"^[a-f0-9]{64}$", indicator, re.IGNORECASE):
        return "file" # SHA256
    if re.match(r"^[a-f0-9]{40}$", indicator, re.IGNORECASE):
        return "file" # SHA1
    if re.match(r"^[a-f0-9]{32}$", indicator, re.IGNORECASE):
        return "file" # MD5
    return "unknown"

@router.get("/analyze")
def analyze_indicator(indicator: str):
    indicator_type = detect_type(indicator)
    if indicator_type == "unknown":
        return OsintResult(
            indicator=indicator,
            type="unknown",
            risk_score=0,
            ai_summary="Indicator type not recognized for OSINT lookup.",
            patterns_found=[],
            recommendation="Manual review recommended."
        )

    # Query AlienVault OTX (no auth required for basic general endpoint)
    url = f"https://otx.alienvault.com/api/v1/indicators/{indicator_type}/{indicator}/general"
    
    try:
        headers = {"User-Agent": "NexusDFI/3.0.0 OSINT Module"}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            pulse_info = data.get("pulse_info", {})
            pulses = pulse_info.get("pulses", [])
            pulse_count = pulse_info.get("count", 0)
            
            # Calculate Risk Score based on pulse count
            risk_score = min(100, pulse_count * 8)
            if risk_score == 0 and data.get("reputation", 0) > 0:
                risk_score = 40
                
            patterns = []
            for pulse in pulses[:5]: # Take top 5
                patterns.append(ThreatPattern(
                    type="OTX Pulse",
                    severity="High",
                    description=pulse.get("name", "Unknown Threat Campaign"),
                    count=1
                ))

            # Build authentic summary
            summary_parts = []
            asn = data.get("asn", "")
            country = data.get("country_name", "")
            
            if asn or country:
                summary_parts.append(f"Infrastructure: {asn} ({country}).")
            
            if pulse_count > 0:
                summary_parts.append(f"Indicator appears in {pulse_count} AlienVault OTX Threat Pulses.")
                if "malware_families" in pulse_info.get("related", {}).get("alienvault", {}):
                    malware = pulse_info["related"]["alienvault"]["malware_families"]
                    if malware:
                        summary_parts.append(f"Associated malware families: {', '.join(malware)}.")
            else:
                summary_parts.append("No active threat pulses found in public OSINT databases.")

            # Validation / False Positives
            fps = data.get("validation", [])
            for fp in fps:
                if fp.get("source") == "whitelist" or fp.get("source") == "false_positive":
                    risk_score = 0
                    summary_parts.append(f"KNOWN FALSE POSITIVE: {fp.get('message', '')}.")

            ai_summary = " ".join(summary_parts)
            
            if risk_score >= 70:
                recommendation = "CRITICAL: Block indicator immediately. Initiate incident response."
            elif risk_score >= 40:
                recommendation = "Flag for monitoring. Cross-reference sources."
            else:
                recommendation = "Low confidence threat. Continue monitoring."

            return OsintResult(
                indicator=indicator,
                type=indicator_type.lower() if indicator_type != "file" else "hash",
                risk_score=risk_score,
                ai_summary=ai_summary,
                patterns_found=patterns,
                recommendation=recommendation,
                raw_data=data
            )
        elif response.status_code == 404:
            return OsintResult(
                indicator=indicator,
                type=indicator_type.lower() if indicator_type != "file" else "hash",
                risk_score=0,
                ai_summary="Indicator not found in AlienVault OTX public database.",
                patterns_found=[],
                recommendation="No known threat intelligence found."
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch from OSINT API")
            
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))
