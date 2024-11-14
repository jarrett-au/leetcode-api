from typing import Any, Dict, Optional

from pydantic import BaseModel


class LeetCodeGraphQLQuery(BaseModel):
    query: str
    variables: Dict[str, Any]
    operationName: Optional[str] = None
