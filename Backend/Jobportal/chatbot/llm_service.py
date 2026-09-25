import os

from google import genai
from google.genai import types
from dotenv import load_dotenv


load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


CHAT_MODEL = os.getenv(
    "GEMINI_CHAT_MODEL",
    "gemini-3.8-flash"
)


def generate_answer(
    question,
    context
):

    prompt = f"""
You are JobPortal AI.

Answer the user's question using
the provided context.

Do not invent facts.

If the context does not contain
the answer, say that you do not
have enough information.

Context:
{context}

User Question:
{question}
"""

    response = client.models.generate_content(

        model=CHAT_MODEL,

        contents=prompt,

        config=types.GenerateContentConfig(
            system_instruction=(
                "You are a helpful JobPortal "
                "career assistant."
            ),
            temperature=0.2
        )
    )

    return response.text