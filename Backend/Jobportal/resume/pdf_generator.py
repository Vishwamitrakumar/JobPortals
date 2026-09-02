from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    ListFlowable,
    ListItem,
)
from reportlab.lib.units import mm


def generate_resume_pdf(resume_data):

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    story = []

    full_name = resume_data.get(
        "full_name",
        ""
    )

    headline = resume_data.get(
        "headline",
        ""
    )

    contact = " | ".join(
        filter(
            None,
            [
                resume_data.get("email"),
                resume_data.get("phone"),
                resume_data.get("location"),
            ]
        )
    )

    story.append(
        Paragraph(
            f"<b>{full_name}</b>",
            styles["Title"]
        )
    )

    if headline:
        story.append(
            Paragraph(
                headline,
                styles["Heading3"]
            )
        )

    if contact:
        story.append(
            Paragraph(
                contact,
                styles["Normal"]
            )
        )

    story.append(Spacer(1, 10))

    def add_section(title):

        story.append(
            Paragraph(
                title,
                styles["Heading2"]
            )
        )

    summary = resume_data.get(
        "summary",
        ""
    )

    if summary:

        add_section("SUMMARY")

        story.append(
            Paragraph(
                summary,
                styles["Normal"]
            )
        )

        story.append(Spacer(1, 8))

    skills = resume_data.get(
        "skills",
        []
    )

    if skills:

        add_section("SKILLS")

        story.append(
            Paragraph(
                " • ".join(skills),
                styles["Normal"]
            )
        )

        story.append(Spacer(1, 8))

    experience = resume_data.get(
        "experience",
        []
    )

    if experience:

        add_section("EXPERIENCE")

        for item in experience:

            title = (
                f"<b>{item.get('position', '')}</b> "
                f"- {item.get('company', '')}"
            )

            story.append(
                Paragraph(
                    title,
                    styles["Normal"]
                )
            )

            dates = (
                f"{item.get('start_date', '')} - "
                f"{item.get('end_date', '')}"
            )

            story.append(
                Paragraph(
                    dates,
                    styles["Normal"]
                )
            )

            achievements = item.get(
                "achievements",
                []
            )

            if achievements:

                story.append(
                    ListFlowable(
                        [
                            ListItem(
                                Paragraph(
                                    achievement,
                                    styles["Normal"]
                                )
                            )
                            for achievement in achievements
                        ],
                        bulletType="bullet",
                    )
                )

            story.append(
                Spacer(1, 8)
            )

    projects = resume_data.get(
        "projects",
        []
    )

    if projects:

        add_section("PROJECTS")

        for project in projects:

            story.append(
                Paragraph(
                    f"<b>{project.get('name', '')}</b>",
                    styles["Normal"]
                )
            )

            story.append(
                Paragraph(
                    project.get(
                        "description",
                        ""
                    ),
                    styles["Normal"]
                )
            )

            technologies = project.get(
                "technologies",
                []
            )

            if technologies:

                story.append(
                    Paragraph(
                        "Technologies: "
                        + ", ".join(technologies),
                        styles["Normal"]
                    )
                )

            story.append(
                Spacer(1, 6)
            )

    education = resume_data.get(
        "education",
        []
    )

    if education:

        add_section("EDUCATION")

        for item in education:

            story.append(
                Paragraph(
                    f"<b>{item.get('degree', '')}</b> - "
                    f"{item.get('institution', '')} "
                    f"({item.get('year', '')})",
                    styles["Normal"]
                )
            )

    certifications = resume_data.get(
        "certifications",
        []
    )

    if certifications:

        add_section("CERTIFICATIONS")

        for certification in certifications:

            story.append(
                Paragraph(
                    certification,
                    styles["Normal"]
                )
            )

    document.build(story)

    buffer.seek(0)

    return buffer