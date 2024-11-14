from typing import Any, Dict

import requests

from leetcode_api.common.utils.logger import logger
from leetcode_api.core.main.dto.query import LeetCodeGraphQLQuery


class BaseFetcher:
    @staticmethod
    def url_request(url: str, body: LeetCodeGraphQLQuery) -> Dict[str, Any] | None:
        try:
            response = requests.post(url, json=body)
            if response.status_code == 200:
                logger.info("Request success.")
                return response.json()
            else:
                logger.error(f"Request failed with status code: {response.status_code}")
        except Exception as err:
            logger.error(f"Other error occurred: {err}")
