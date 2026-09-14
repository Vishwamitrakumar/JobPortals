import re


def normalize_skill(skill):
    return skill.strip().lower()


def parse_job_skills(key_skills):
    """
    Job ke key_skills ko list me convert karta hai.

    Example:
    "Python, Django, React, PostgreSQL"

    becomes:

    ["python", "django", "react", "postgresql"]
    """

    if not key_skills:
        return []

    # Agar already list hai
    if isinstance(key_skills, list):
        return [
            normalize_skill(skill)
            for skill in key_skills
            if skill
        ]

    # String hai to comma, newline aur | se split
    skills = re.split(r",|\n|\|", key_skills)

    return [
        normalize_skill(skill)
        for skill in skills
        if skill.strip()
    ]


def calculate_skill_match(resume_skills, job_skills):
    """
    Resume skills aur Job required skills ka match calculate karta hai.
    """

    resume_set = {
        normalize_skill(skill)
        for skill in resume_skills
        if skill
    }

    job_set = {
        normalize_skill(skill)
        for skill in job_skills
        if skill
    }

    # Job me required skills nahi hain
    if not job_set:
        return {
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": [],
        }

    # Common skills
    matched_skills = sorted(
        resume_set.intersection(job_set)
    )

    # Job ki jo skills resume me nahi hain
    missing_skills = sorted(
        job_set - resume_set
    )

    # Match percentage
    score = (
        len(matched_skills) / len(job_set)
    ) * 100

    return {
        "match_score": round(score, 2),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }