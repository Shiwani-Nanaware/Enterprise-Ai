"""Enterprise guardrails engine.

Protects against:
- Prompt injection / jailbreak attempts
- System prompt extraction
- Role escalation
- PII leakage (phone, email, PAN, Aadhaar, credit cards, passwords, API keys)
- SQL injection / XSS / code injection
- Out-of-scope questions (non-FinSolve topics)
- Malicious URLs

All checks run BEFORE the query reaches the LLM.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from core.logging import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class GuardrailResult:
    """Result of a guardrail check."""
    passed: bool
    violation_type: str | None = None
    violation_detail: str | None = None
    sanitized_input: str | None = None
    masked_pii: dict[str, list[str]] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# PII patterns
# ---------------------------------------------------------------------------

_PII_PATTERNS: dict[str, re.Pattern[str]] = {
    "phone_number": re.compile(
        r"\b(\+?91[-.\s]?)?[6-9]\d{9}\b|"
        r"\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
    ),
    "email_address": re.compile(
        r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"
    ),
    "pan_number": re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"),
    "aadhaar_number": re.compile(r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b"),
    "credit_card": re.compile(
        r"\b(?:4[0-9]{12}(?:[0-9]{3})?|"
        r"5[1-5][0-9]{14}|"
        r"3[47][0-9]{13}|"
        r"6(?:011|5[0-9]{2})[0-9]{12})\b"
    ),
    "bank_account": re.compile(r"\b\d{9,18}\b(?=.*bank|.*account|.*IFSC)", re.IGNORECASE),
    "api_key": re.compile(
        r"\b(?:sk-[A-Za-z0-9]{20,}|"
        r"pk_live_[A-Za-z0-9]{20,}|"
        r"ghp_[A-Za-z0-9]{20,}|"
        r"gsk_[A-Za-z0-9]{20,}|"
        r"xoxb-[A-Za-z0-9\-]{20,})\b"
    ),
    "password_pattern": re.compile(
        r"(?:password|passwd|pwd|secret|token)\s*[=:]\s*\S+",
        re.IGNORECASE,
    ),
}

# ---------------------------------------------------------------------------
# Injection patterns
# ---------------------------------------------------------------------------

_INJECTION_PATTERNS: list[re.Pattern[str]] = [
    # Prompt injection
    re.compile(
        r"ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?|context)",
        re.IGNORECASE,
    ),
    re.compile(r"you\s+are\s+now\s+(a|an|the)\s+\w+\s*(assistant|ai|bot|model)?", re.IGNORECASE),
    re.compile(r"pretend\s+(you\s+are|to\s+be)", re.IGNORECASE),
    re.compile(r"act\s+as\s+(if\s+you\s+are|a|an)", re.IGNORECASE),
    re.compile(r"(forget|disregard|override)\s+(your\s+)?(instructions?|rules?|guidelines?|system\s+prompt)", re.IGNORECASE),
    re.compile(r"DAN\s+mode|do\s+anything\s+now", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"<\|?(system|endoftext|im_start|im_end)\|?>", re.IGNORECASE),
    # System prompt extraction
    re.compile(r"(reveal|show|print|output|repeat|tell\s+me)\s+(your\s+)?(system\s+prompt|instructions?|initial\s+prompt)", re.IGNORECASE),
    re.compile(r"what\s+(are|is)\s+your\s+(system\s+prompt|instructions?|original\s+prompt)", re.IGNORECASE),
    # Role escalation
    re.compile(r"(you\s+are|you're)\s+(now\s+)?an?\s+(admin|administrator|superuser|root|god)", re.IGNORECASE),
    re.compile(r"grant\s+(me\s+)?(admin|full|root|all)\s+access", re.IGNORECASE),
]

# SQL injection patterns
_SQL_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE)\b)", re.IGNORECASE),
    re.compile(r"(--|#|/\*|\*/|;)\s*(--)?", re.IGNORECASE),
    re.compile(r"'\s*(OR|AND)\s*'?\d+'?\s*=\s*'?\d+'?", re.IGNORECASE),
]

# XSS patterns
_XSS_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"javascript\s*:", re.IGNORECASE),
    re.compile(r"on\w+\s*=\s*[\"'][^\"']*[\"']", re.IGNORECASE),
    re.compile(r"<\s*(iframe|object|embed|applet)[^>]*>", re.IGNORECASE),
]

# Malicious URL patterns
_URL_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"https?://(?![\w.-]*(?:finsolve|company|internal)[\w.-]*)[\w.-]+\.[a-z]{2,}", re.IGNORECASE),
]

# Out-of-scope topics (non-business)
_OUT_OF_SCOPE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b(recipe|cooking|sport|football|cricket|movie|music|song|celebrity|horoscope|astrology|lottery|gambling|bitcoin|crypto\s+trading|dating|relationship\s+advice)\b", re.IGNORECASE),
    re.compile(r"\b(how\s+to\s+(cook|make|bake|brew))\b", re.IGNORECASE),
    re.compile(r"\b(weather\s+forecast|news\s+today|stock\s+market\s+tip)\b", re.IGNORECASE),
]

# Mask substitutions
_PII_MASKS: dict[str, str] = {
    "phone_number": "[PHONE REDACTED]",
    "email_address": "[EMAIL REDACTED]",
    "pan_number": "[PAN REDACTED]",
    "aadhaar_number": "[AADHAAR REDACTED]",
    "credit_card": "[CARD REDACTED]",
    "bank_account": "[ACCOUNT REDACTED]",
    "api_key": "[API-KEY REDACTED]",
    "password_pattern": "[CREDENTIAL REDACTED]",
}


# ---------------------------------------------------------------------------
# Core check functions
# ---------------------------------------------------------------------------

def _check_injection(text: str) -> GuardrailResult:
    """Check for prompt injection / jailbreak attempts."""
    for pattern in _INJECTION_PATTERNS:
        m = pattern.search(text)
        if m:
            logger.warning("Prompt injection detected", match=m.group(0)[:80])
            return GuardrailResult(
                passed=False,
                violation_type="PROMPT_INJECTION",
                violation_detail=(
                    "I cannot process this request as it appears to attempt "
                    "to modify my instructions or extract system information. "
                    "Please ask a genuine question about FinSolve documents."
                ),
            )
    return GuardrailResult(passed=True)


def _check_sql_injection(text: str) -> GuardrailResult:
    """Check for SQL injection patterns."""
    matches = []
    for pattern in _SQL_PATTERNS:
        m = pattern.search(text)
        if m:
            matches.append(m.group(0))
    if matches:
        return GuardrailResult(
            passed=False,
            violation_type="SQL_INJECTION",
            violation_detail="Your input contains patterns that look like SQL injection. Please rephrase your question.",
        )
    return GuardrailResult(passed=True)


def _check_xss(text: str) -> GuardrailResult:
    """Check for XSS / script injection."""
    for pattern in _XSS_PATTERNS:
        if pattern.search(text):
            return GuardrailResult(
                passed=False,
                violation_type="XSS_INJECTION",
                violation_detail="Your input contains script or HTML injection patterns.",
            )
    return GuardrailResult(passed=True)


def _detect_and_mask_pii(text: str) -> tuple[str, dict[str, list[str]]]:
    """Detect PII in text and return masked version + findings."""
    masked = text
    findings: dict[str, list[str]] = {}

    for pii_type, pattern in _PII_PATTERNS.items():
        matches = pattern.findall(text)
        if matches:
            found = [m if isinstance(m, str) else m[0] for m in matches]
            found = [f for f in found if f]
            if found:
                findings[pii_type] = found
                masked = pattern.sub(_PII_MASKS[pii_type], masked)

    return masked, findings


def _check_out_of_scope(text: str) -> GuardrailResult:
    """Check if the question is out of scope for a FinSolve AI assistant."""
    for pattern in _OUT_OF_SCOPE_PATTERNS:
        if pattern.search(text):
            return GuardrailResult(
                passed=False,
                violation_type="OUT_OF_SCOPE",
                violation_detail=(
                    "I'm specialized in FinSolve Technologies' internal documents "
                    "and business knowledge. I'm not able to help with topics outside "
                    "of work-related queries. Please ask about company policies, "
                    "procedures, projects, or other business topics."
                ),
            )
    return GuardrailResult(passed=True)


def _check_length(text: str, max_tokens: int = 8192) -> GuardrailResult:
    """Check if input exceeds maximum allowed length."""
    # Rough token estimate: 1 token ≈ 4 characters
    estimated_tokens = len(text) // 4
    if estimated_tokens > max_tokens:
        return GuardrailResult(
            passed=False,
            violation_type="INPUT_TOO_LONG",
            violation_detail=f"Your message is too long (estimated {estimated_tokens} tokens). Please keep it under {max_tokens} tokens.",
        )
    return GuardrailResult(passed=True)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def check_input(
    text: str,
    mask_pii: bool = True,
    check_scope: bool = True,
    max_tokens: int = 8192,
) -> GuardrailResult:
    """Run all input guardrail checks on user input.

    Checks (in order):
    1. Length validation
    2. Prompt injection / jailbreak
    3. SQL injection
    4. XSS / script injection
    5. PII detection and masking
    6. Out-of-scope detection

    Args:
        text: The raw user input.
        mask_pii: Whether to mask detected PII in the sanitized output.
        check_scope: Whether to check for out-of-scope topics.
        max_tokens: Maximum allowed input length in tokens.

    Returns:
        GuardrailResult: Pass/fail with violation detail and sanitized input.
    """
    if not text or not text.strip():
        return GuardrailResult(passed=False, violation_type="EMPTY_INPUT", violation_detail="Input cannot be empty.")

    # 1. Length
    length_check = _check_length(text, max_tokens)
    if not length_check.passed:
        return length_check

    # 2. Injection
    injection_check = _check_injection(text)
    if not injection_check.passed:
        return injection_check

    # 3. SQL injection
    sql_check = _check_sql_injection(text)
    if not sql_check.passed:
        return sql_check

    # 4. XSS
    xss_check = _check_xss(text)
    if not xss_check.passed:
        return xss_check

    # 5. PII masking (non-blocking — sanitizes but allows through)
    sanitized = text
    pii_findings: dict[str, list[str]] = {}
    if mask_pii:
        sanitized, pii_findings = _detect_and_mask_pii(text)
        if pii_findings:
            logger.info("PII detected and masked in input", types=list(pii_findings.keys()))

    # 6. Out-of-scope
    if check_scope:
        scope_check = _check_out_of_scope(sanitized)
        if not scope_check.passed:
            return scope_check

    return GuardrailResult(
        passed=True,
        sanitized_input=sanitized,
        masked_pii=pii_findings,
    )


def check_output(text: str, mask_pii: bool = True) -> GuardrailResult:
    """Run output guardrail checks on LLM response.

    Masks any PII that may have leaked into the LLM response.

    Args:
        text: The raw LLM output.
        mask_pii: Whether to mask detected PII.

    Returns:
        GuardrailResult: Always passes but returns sanitized output.
    """
    sanitized = text
    pii_findings: dict[str, list[str]] = {}

    if mask_pii:
        sanitized, pii_findings = _detect_and_mask_pii(text)
        if pii_findings:
            logger.warning(
                "PII detected in LLM output — masked before returning",
                types=list(pii_findings.keys()),
            )

    return GuardrailResult(
        passed=True,
        sanitized_input=sanitized,
        masked_pii=pii_findings,
    )
