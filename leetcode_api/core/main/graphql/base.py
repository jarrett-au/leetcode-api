from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class TopicTag(BaseModel):
    name: str
    slug: Optional[str] = None
    translated_name: Optional[str] = Field(None, alias="translatedName")


class CompanyTag(BaseModel):
    img_url: str = Field(..., alias="imgUrl")
    slug: str
    num_subscribed: int = Field(..., alias="numSubscribed")


class QuestionExtra(BaseModel):
    top_company_tags: Optional[List[CompanyTag]] = Field(None, alias="topCompanyTags")


class BaseQuestion(BaseModel):
    question_id: str = Field(..., alias="questionId")
    question_frontend_id: str = Field(..., alias="questionFrontendId")
    title: str
    title_slug: str = Field(..., alias="titleSlug")
    difficulty: Difficulty
    topic_tags: List[TopicTag] = Field(..., alias="topicTags")
    extra: Optional[QuestionExtra] = None

    @classmethod
    def to_graphql_fields(cls) -> str:
        """将模型字段转换为GraphQL查询字段"""
        fields = []
        for field_name, field in cls.model_fields.items():
            graphql_name = field.alias or field_name
            if field.annotation == List[TopicTag]:
                fields.append(f"{graphql_name} {{ name slug translatedName }}")
            elif field.annotation == Optional[QuestionExtra]:
                fields.append(
                    f"{graphql_name} {{ topCompanyTags {{ imgUrl slug numSubscribed }} }}"
                )
            else:
                fields.append(graphql_name)
        return "\n".join(fields)


if __name__ == "__main__":
    print(BaseQuestion.to_graphql_fields())
