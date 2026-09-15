def extract_job_keyword(message):

    keywords = [
        "python",
        "django",
        "java",
        "javascript",
        "react",
        "node",
        "frontend",
        "backend",
        "full stack",
        "software engineer",
        "developer",
    ]

    message_lower = message.lower()

    for keyword in keywords:

        if keyword in message_lower:
            return keyword

    return None