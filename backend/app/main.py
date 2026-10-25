from fastapi import FastAPI, HTTPException, status
from app.schemas import VideoPrepare, VideoPrepareResponse, QuestionRequest, QuestionResponse
from app.rag_pipeline import prepare_video, ask_question



app = FastAPI(title="Youtube Chat")



@app.get("/")
def health():
    return {
        "message" : "App is working",
    }


@app.post(
    "/video",
    response_model=VideoPrepareResponse,
    status_code=status.HTTP_201_CREATED,
)
def prepare(
    video_data : VideoPrepare,
):
    video_id = video_data.video_id.strip()

    try:
        result = prepare_video(video_id=video_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )



@app.post(
    "/question",
    response_model=QuestionResponse,
    status_code=status.HTTP_200_OK,
)
def ask(
    request : QuestionRequest,
):
    video_id = request.video_id.strip()
    question = request.question.strip()

    try:
        result = ask_question(
            video_id=video_id,
            question=question,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )