SKILLS = [
    # =========================
    # Programming Languages
    # =========================
    "python",
    "javascript",
    "typescript",
    "java",
    "c",
    "c++",
    "c#",
    "go",
    "rust",
    "php",
    "kotlin",
    "swift",

    # =========================
    # Backend / Frameworks
    # =========================
    "django",
    "django rest framework",
    "fastapi",
    "flask",
    "node.js",
    "express",
    "spring",
    "spring boot",
    "laravel",
    ".net",
    "asp.net",

    # =========================
    # Frontend
    # =========================
    "react",
    "next.js",
    "angular",
    "vue.js",
    "html",
    "css",
    "tailwind css",
    "bootstrap",
    "material ui",
    "redux",
    "jquery",

    # =========================
    # Databases
    # =========================
    "postgresql",
    "mysql",
    "mongodb",
    "sqlite",
    "oracle",
    "sql server",
    "redis",
    "elasticsearch",
    "firebase",

    # =========================
    # APIs / Architecture
    # =========================
    "rest api",
    "graphql",
    "microservices",
    "websocket",
    "api development",
    "api integration",
    "authentication",
    "authorization",
    "jwt",
    "oauth",

    # =========================
    # Cloud / DevOps
    # =========================
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "google cloud",
    "gcp",
    "linux",
    "nginx",
    "jenkins",
    "ci/cd",
    "github actions",
    "terraform",

    # =========================
    # Version Control
    # =========================
    "git",
    "github",
    "gitlab",
    "bitbucket",

    # =========================
    # Data Science / AI / ML
    # =========================
    "pandas",
    "numpy",
    "scikit-learn",
    "matplotlib",
    "seaborn",
    "tensorflow",
    "pytorch",
    "keras",
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "natural language processing",
    "nlp",
    "computer vision",
    "generative ai",
    "large language models",
    "llm",
    "rag",
    "prompt engineering",

    # =========================
    # Data / Analytics
    # =========================
    "data analysis",
    "data visualization",
    "statistics",
    "excel",
    "power bi",
    "tableau",
    "sql",
    "etl",

    # =========================
    # Testing
    # =========================
    "unit testing",
    "integration testing",
    "pytest",
    "unittest",
    "selenium",
    "postman",
    "jest",
    "cypress",

    # =========================
    # Software Engineering
    # =========================
    "object oriented programming",
    "oops",
    "data structures",
    "algorithms",
    "problem solving",
    "software development",
    "software engineering",
    "debugging",
    "code review",
    "system design",
    "design patterns",
    "clean code",

    # =========================
    # Tools
    # =========================
    "vs code",
    "visual studio",
    "pycharm",
    "jupyter notebook",
    "jira",
    "confluence",
    "figma",

    # =========================
    # Professional / Non-Technical
    # =========================
    "communication",
    "verbal communication",
    "written communication",
    "english communication",
    "teamwork",
    "team collaboration",
    "leadership",
    "time management",
    "problem solving",
    "critical thinking",
    "analytical thinking",
    "decision making",
    "adaptability",
    "flexibility",
    "creativity",
    "innovation",
    "work ethic",
    "professionalism",
    "responsibility",
    "accountability",
    "self motivation",
    "self management",
    "interpersonal skills",
    "presentation skills",
    "public speaking",
    "negotiation",
    "conflict resolution",
    "customer service",
    "client management",
    "stakeholder management",
    "project management",
    "team management",
    "mentoring",
    "coaching",
    "collaboration",
    "attention to detail",
    "organizational skills",
    "multitasking",
    "research skills",

    # =========================
    # Business / Management
    # =========================
    "business analysis",
    "business development",
    "sales",
    "marketing",
    "digital marketing",
    "content writing",
    "technical writing",
    "project planning",
    "project coordination",
    "product management",
    "operations management",

    # =========================
    # Common B.Tech Skills
    # =========================
    "engineering",
    "technical support",
    "technical documentation",
    "requirements analysis",
    "requirements gathering",
    "troubleshooting",
    "research and development",
    "quality assurance",
    "quality control",
    "process improvement",
    "documentation",
]


def extract_skills(text):

    text = text.lower()

    found_skills = []

    for skill in SKILLS:
        if skill in text:
            found_skills.append(skill)

    return found_skills