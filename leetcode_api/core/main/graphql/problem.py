from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from leetcode_api.core.main.graphql import BaseQuestion


class SelectProblemQuestion(BaseQuestion):
    content: str
    hints: List[str]
    translated_title: Optional[str] = Field(None, alias="translatedTitle")
    translated_content: Optional[str] = Field(None, alias="translatedContent")
    similar_questions: Optional[str] = Field(None, alias="similarQuestions")

    @classmethod
    def generate_query(cls, title_slug_var: str = "titleSlug") -> str:
        """生成完整的GraphQL查询语句"""
        fields = cls.to_graphql_fields()
        fields = "\n    ".join(fields.split("\n"))
        query = (
            "query selectProblem($" + title_slug_var + ": String!) {\n"
            "  question(" + title_slug_var + ": $" + title_slug_var + ") {\n"
            f"    {fields}\n"
            "  }\n"
            "}"
        )
        return query


class DailyQuestion(BaseQuestion):
    paid_only: bool = Field(..., alias="isPaidOnly")
    freq_bar: Optional[str] = Field(None, alias="freqBar")
    is_favor: bool = Field(..., alias="isFavor")
    ac_rate: float = Field(..., alias="acRate")
    status: Optional[str] = None
    solution_num: int = Field(..., alias="solutionNum")
    has_video_solution: bool = Field(..., alias="hasVideoSolution")


class TodayRecord(BaseModel):
    date: str
    user_status: Optional[str] = Field(None, alias="userStatus")
    question: DailyQuestion

    @classmethod
    def generate_query(cls) -> str:
        """生成完整的GraphQL查询语句"""
        fields = DailyQuestion.to_graphql_fields()
        fields = "\n      ".join(fields.split("\n"))

        query = (
            "query questionOfToday {\n"
            "  todayRecord{\n"
            "    date\n"
            "    userStatus\n"
            "    question {\n"
            f"      {fields}\n"
            "    }\n"
            "  }\n"
            "}"
        )
        return query


if __name__ == "__main__":
    print(SelectProblemQuestion.generate_query())
    print(TodayRecord.generate_query())
