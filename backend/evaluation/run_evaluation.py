
import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from ragas.llms import llm_factory
from ragas.metrics.collections import Faithfulness, AnswerCorrectness, AnswerRelevancy
from openai import AsyncOpenAI
from ragas.embeddings import HuggingFaceEmbeddings
from ragas.embeddings.base import embedding_factory

from app.rag_pipeline import prepare_video, ask_question


load_dotenv()


API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
        raise RuntimeError("GOOGLE API KEY not found")

openai_client = AsyncOpenAI(
    api_key=API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset.json"
RESULTS_DIR = BASE_DIR / "results"

OUTPUT_PATH = RESULTS_DIR / "evaluation_results.json"



def load_dataset():
    with DATASET_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


async def main():
    
    evaluator_llm = llm_factory(
        model="gemini-3.5-flash-lite",
        client=openai_client,
    )
    
    evaluator_embeddings = embedding_factory(
        provider="huggingface",
        model="sentence-transformers/all-MiniLM-L6-v2",
        interface="modern",
    )

    faithfulness = Faithfulness(llm=evaluator_llm)
    answer_correctness = AnswerCorrectness(
        llm=evaluator_llm,
        embeddings=evaluator_embeddings, # type: ignore
    )
    answer_relevancy = AnswerRelevancy(
        llm=evaluator_llm,
        embeddings=evaluator_embeddings, # type: ignore
    )

    dataset = load_dataset()
    results = []

    # Prepare each distinct video only once.
    prepared_videos = set()

    for i, item in enumerate(dataset, start=1):
        video_id = item["video_id"]
        question = item["question"]
        reference = item["reference_answer"]

        print(f"\nQuestion {i}/{len(dataset)}: {question}")

        row = {
            "video_id": video_id,
            "question": question,
            "reference_answer": reference,
        }

        try:
            if video_id not in prepared_videos:
                preparation = prepare_video(video_id)
                prepared_videos.add(video_id)
                print("Video prepared:", preparation)

            # Run the existing RAG pipeline.
            output = ask_question(video_id, question)

            contexts = [
                source["text"]
                for source in output["sources"]
            ]

            faithfullness_score = await faithfulness.ascore(
                user_input=question,
                response=output["answer"],
                retrieved_contexts=contexts,
            )

            correctness_score = await answer_correctness.ascore(
                user_input=question,
                response=output["answer"],
                reference=reference,
            )

            relevancy_score = await answer_relevancy.ascore(
                user_input=question,
                response=output["answer"],
            )

            row.update({
                "answer": output["answer"],
                "contexts": contexts,
                "faithfulness": faithfullness_score.value,
                "answer_correctness" : correctness_score.value,
                "answer_relevancy" : relevancy_score.value,
            })

        except Exception as exc:
            print(str(exc))

        results.append(row)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(results, file, indent=2, ensure_ascii=False)

    print(f"\nResults saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
