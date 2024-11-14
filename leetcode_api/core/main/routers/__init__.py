import json

from fastapi import APIRouter, Query, Request, Response

from leetcode_api.common.utils.logger import logger
from leetcode_api.core.main.service.problem_fetcher import ProblemFetcher

router = APIRouter()


@router.get(path="/api/select", summary="获取题目详情")
def api_get_problem_detail(title: str = Query(title="网址或者slug")):
    try:
        response = ProblemFetcher.fetch_single_problem(title)
        return Response(
            content=json.dumps(response.model_dump(), ensure_ascii=False),
            media_type="application/json",
        )
    except Exception as e:
        logger.error(f"An error occurred: {e}")


@router.get(path="/api/daily", summary="每日一题")
def api_get_daily_problem():
    try:
        response = ProblemFetcher.fetch_daily_problem()
        return Response(
            content=json.dumps(response.model_dump(), ensure_ascii=False),
            media_type="application/json",
        )
    except Exception as e:
        logger.error(f"An error occurred: {e}")
