"""Pagination utilities for list API endpoints."""

import math

from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    """Query parameter schema for paginated endpoints.

    Attributes:
        page: The 1-indexed page number.
        page_size: Number of items per page.
    """

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        """Calculate the database query offset.

        Returns:
            int: Number of records to skip for the current page.
        """
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        """Return the query limit (alias for page_size).

        Returns:
            int: Maximum records to return.
        """
        return self.page_size


def calculate_total_pages(total: int, page_size: int) -> int:
    """Calculate the total number of pages for a given item count.

    Args:
        total: Total number of items.
        page_size: Number of items per page.

    Returns:
        int: Total number of pages (minimum 1).
    """
    if total == 0:
        return 1
    return math.ceil(total / page_size)
