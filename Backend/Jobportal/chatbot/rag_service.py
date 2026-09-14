import os

from pypdf import PdfReader
from openai import OpenAI
from pgvector.django import CosineDistance

from Jobportal.model.chatbot import DocumentChunk


# ==================================================
# OPENAI CLIENT
# ==================================================

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


EMBEDDING_MODEL = os.getenv(
    "OPENAI_EMBEDDING_MODEL",
    "text-embedding-3-small"
)


# ==================================================
# CREATE EMBEDDING
# ==================================================

def create_embedding(text):

    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )

    return response.data[0].embedding


# ==================================================
# EXTRACT PDF TEXT
# ==================================================

def extract_pdf_text(pdf_path):

    reader = PdfReader(pdf_path)

    pages = []

    for page_number, page in enumerate(
        reader.pages,
        start=1
    ):

        text = page.extract_text()

        if text:

            pages.append(
                {
                    "page_number": page_number,
                    "content": text
                }
            )

    return pages


# ==================================================
# SPLIT TEXT INTO CHUNKS
# ==================================================

def split_text(
    text,
    chunk_size=1000,
    overlap=200
):

    chunks = []

    start = 0

    while start < len(text):

        end = start + chunk_size

        chunk = text[start:end]

        if chunk.strip():

            chunks.append(
                chunk.strip()
            )

        start += chunk_size - overlap

    return chunks


# ==================================================
# INDEX PDF
# ==================================================

def index_pdf(pdf_path):

    pages = extract_pdf_text(
        pdf_path
    )

    source = os.path.basename(
        pdf_path
    )

    for page in pages:

        chunks = split_text(
            page["content"]
        )

        for chunk in chunks:

            embedding = create_embedding(
                chunk
            )

            DocumentChunk.objects.create(
                source=source,
                page_number=page["page_number"],
                content=chunk,
                embedding=embedding
            )


# ==================================================
# SEARCH DOCUMENTS
# ==================================================

def search_documents(
    question,
    limit=5
):

    query_embedding = create_embedding(
        question
    )

    results = (
        DocumentChunk.objects
        .annotate(
            distance=CosineDistance(
                "embedding",
                query_embedding
            )
        )
        .order_by("distance")[:limit]
    )

    return results


# ==================================================
# ANSWER FROM RAG
# ==================================================

def answer_from_rag(
    question
):

    documents = search_documents(
        question,
        limit=5
    )

    if not documents:

        return (
            "I couldn't find relevant information "
            "in the available documents."
        )

    context_parts = []

    for document in documents:

        context_parts.append(
            f"""
Source: {document.source}
Page: {document.page_number}

{document.content}
"""
        )

    context = "\n\n".join(
        context_parts
    )

    from .llm_service import generate_answer

    return generate_answer(
        question,
        context
    )