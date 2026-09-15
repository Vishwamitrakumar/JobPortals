def detect_intent(message):

    text = message.lower().strip()

    # ---------------------------------
    # JOB SEARCH
    # ---------------------------------

    if any(word in text for word in [
        "job",
        "jobs",
        "vacancy",
        "vacancies",
        "hiring",
        "developer jobs",
    ]):
        return "JOB_SEARCH"

    # ---------------------------------
    # APPLICATION
    # ---------------------------------

    if any(word in text for word in [
        "application",
        "applied",
        "application status",
        "my application",
        "shortlisted",
        "rejected",
        "interview status",
    ]):
        return "APPLICATION_STATUS"

    # ---------------------------------
    # PROFILE
    # ---------------------------------

    if any(word in text for word in [
        "profile",
        "my profile",
        "resume",
        "cv",
    ]):
        return "PROFILE"

    # ---------------------------------
    # JOB RECOMMENDATION
    # ---------------------------------

    if any(word in text for word in [
        "recommend",
        "recommendation",
        "suggest job",
        "best job",
        "suitable job",
        "jobs for me",
    ]):
        return "JOB_RECOMMENDATION"

    # ---------------------------------
    # INTERVIEW
    # ---------------------------------

    if any(word in text for word in [
        "interview",
        "interview question",
        "interview preparation",
        "prepare interview",
    ]):
        return "INTERVIEW"

    # ---------------------------------
    # GENERAL
    # ---------------------------------

    return "GENERAL"