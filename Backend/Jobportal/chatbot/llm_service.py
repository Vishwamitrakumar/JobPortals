import os

from openai import OpenAI


client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


CHAT_MODEL = os.getenv(
    "OPENAI_CHAT_MODEL",
    "gpt-4o-mini"
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

    response = client.chat.completions.create(

        model=CHAT_MODEL,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful JobPortal "
                    "career assistant."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],

        temperature=0.2
    )

    return response.choices[0].message.content