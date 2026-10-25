from pydantic import BaseModel, Field
from typing import Literal


class VideoPrepare(BaseModel):

    video_id : str = Field(min_length=1)


class VideoPrepareResponse(BaseModel):

    video_id : str
    status : Literal["ready"]


class QuestionRequest(BaseModel):

    video_id : str = Field(min_length=1)
    question : str = Field(min_length=1)


class QuestionResponse(BaseModel):

    video_id : str
    question : str
    answer : str
