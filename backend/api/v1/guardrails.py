"""Guardrails API endpoints.

POST /guardrails/check    — test a message against guardrails
GET  /guardrails/status   — get guardrails configuration status
"""

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from core.config import get_settings
from core.dependencies import CurrentUserDep
from schemas.common import SuccessResponse

router = APIRouter(prefix="/guardrails", tags=["Guardrails"])


class GuardrailCheckRequest(BaseModel):
    """Request to test a message against guardrails."""
    text: str = Field(min_length=1, max_length=32768)
    mask_pii: bool = Field(default=True)
    check_scope: bool = Field(default=True)


class GuardrailCheckResponse(BaseModel):
    """Result of a guardrail check."""
    passed: bool
    violation_type: str | None
    violation_detail: str | None
    sanitized_text: str | None
    pii_detected: list[str]


@router.post(
    "/check",
    response_model=SuccessResponse[GuardrailCheckResponse],
    status_code=status.HTTP_200_OK,
    summary="Test guardrails",
    description="Check a message against all guardrail policies without sending to LLM.",
)
async def check_guardrails(
    body: GuardrailCheckRequest,
    current_user: CurrentUserDep,
) -> SuccessResponse[GuardrailCheckResponse]:
    """Test a message against guardrail policies."""
    from guardrails.engine import check_input

    result = check_input(
        body.text,
        mask_pii=body.mask_pii,
        check_scope=body.check_scope,
    )
    return SuccessResponse(
        data=GuardrailCheckResponse(
            passed=result.passed,
            violation_type=result.violation_type,
            violation_detail=result.violation_detail,
            sanitized_text=result.sanitized_input,
            pii_detected=list(result.masked_pii.keys()),
        )
    )


@router.get(
    "/status",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Guardrails configuration status",
)
async def get_status(current_user: CurrentUserDep) -> SuccessResponse[dict]:
    """Return the current guardrails configuration."""
    settings = get_settings()
    return SuccessResponse(
        data={
            "enabled": settings.guardrails.enabled,
            "content_filter_enabled": settings.guardrails.content_filter_enabled,
            "max_input_tokens": settings.guardrails.max_input_tokens,
            "max_output_tokens": settings.guardrails.max_output_tokens,
            "checks": [
                "prompt_injection",
                "jailbreak",
                "sql_injection",
                "xss_injection",
                "pii_masking",
                "out_of_scope",
                "input_length",
                "system_prompt_extraction",
                "role_escalation",
            ],
        }
    )
