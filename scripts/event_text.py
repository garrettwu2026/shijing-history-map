"""Preserve research markers; normalize repeated legacy suffixes idempotently."""
import re


def clean_event_text(value):
    return re.sub(r'(?:（\s*待考\s*）|\(\s*待考\s*\))+', '（待考）', value)
