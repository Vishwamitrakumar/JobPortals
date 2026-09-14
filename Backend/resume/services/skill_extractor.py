SKILLS = [
    "python",
    "django",
    "django rest framework",
    "react",
    "next.js",
    "javascript",
    "typescript",
    "html",
    "css",
    "tailwind css",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "docker",
    "git",
    "github",
    "rest api",
    "fastapi",
    "flask",
    "node.js",
    "express",
    "aws",
    "azure",
    "pandas",
    "numpy",
]


def extract_skills(text):

    text = text.lower()

    found_skills = []

    for skill in SKILLS:
        if skill in text:
            found_skills.append(skill)

    return found_skills