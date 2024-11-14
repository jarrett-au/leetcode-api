from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_fixed

from leetcode_api.common.utils.logger import log, logger
from leetcode_api.core.app.config import Config
from leetcode_api.core.main.dto.query import LeetCodeGraphQLQuery
from leetcode_api.core.main.graphql.problem import SelectProblemQuestion, TodayRecord
from leetcode_api.core.main.service.base import BaseFetcher


class ProblemFetcher(BaseFetcher):
    url = f"{Config.API_BASE}/graphql"

    @classmethod
    @retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
    def fetch_single_problem(
        cls, title_slug: str, dto=SelectProblemQuestion
    ) -> SelectProblemQuestion:
        if not isinstance(title_slug, str):
            raise ValueError("title_slug must be a string")
        body = LeetCodeGraphQLQuery(
            query=dto.generate_query(),
            variables={"titleSlug": title_slug},
        )
        try:
            resp = cls.url_request(cls.url, body.model_dump())
            if "data" not in resp:
                raise ValueError("Invalid response format")
            return dto(**resp["data"]["question"])
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            raise

    @classmethod
    @retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
    def fetch_daily_problem(cls, dto=TodayRecord) -> TodayRecord:
        body = LeetCodeGraphQLQuery(query=dto.generate_query(), variables={})

        try:
            resp = cls.url_request(cls.url, body.model_dump())
            if "data" not in resp:
                raise ValueError("Invalid response format")
            return dto(**resp["data"]["todayRecord"][0])
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            raise


if __name__ == "__main__":
    # resp = ProblemFetcher.fetch_single_problem("two-sum")
    resp = ProblemFetcher.fetch_daily_problem()
    print(resp.model_dump())
