import json
import os
import tempfile
import time

from google import genai
from google.genai import types
from django.conf import settings


class GeminiResumeService:

    def __init__(self):

        api_key = settings.GEMINI_API_KEY

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is missing from environment."
            )

        self.client = genai.Client(
            api_key=api_key
        )

        self.model = settings.GEMINI_MODEL

        # Retry only temporary Gemini errors
        self.max_retries = 3

    # =========================================================
    # CHECK RETRYABLE ERROR
    # =========================================================

    def _is_retryable_error(self, error):

        error_code = getattr(
            error,
            "code",
            None
        )

        error_text = str(error).upper()

        # -----------------------------------------------------
        # 429 = QUOTA / RATE LIMIT
        #
        # Do NOT retry automatically.
        # If daily quota is exhausted, retrying won't help.
        # -----------------------------------------------------

        if (
            error_code == 429
            or "RESOURCE_EXHAUSTED" in error_text
            or "QUOTA" in error_text
        ):
            return False

        # -----------------------------------------------------
        # Temporary server-side errors
        # -----------------------------------------------------

        if error_code in {
            500,
            503,
            504,
        }:
            return True

        if any(
            value in error_text
            for value in [
                "500",
                "503",
                "504",
                "UNAVAILABLE",
                "SERVICE_UNAVAILABLE",
                "INTERNAL",
                "DEADLINE_EXCEEDED",
            ]
        ):
            return True

        return False

    # =========================================================
    # GET FRIENDLY GEMINI ERROR
    # =========================================================

    def _get_error_message(self, error):

        error_code = getattr(
            error,
            "code",
            None
        )

        error_text = str(error)

        upper_text = error_text.upper()

        # -----------------------------------------------------
        # 429 QUOTA
        # -----------------------------------------------------

        if (
            error_code == 429
            or "RESOURCE_EXHAUSTED" in upper_text
            or "QUOTA" in upper_text
        ):
            return (
                "Gemini API quota has been exceeded. "
                "Please try again later or check your "
                "Gemini API quota/billing plan."
            )

        # -----------------------------------------------------
        # 503
        # -----------------------------------------------------

        if (
            error_code == 503
            or "503" in upper_text
            or "UNAVAILABLE" in upper_text
        ):
            return (
                "Gemini is temporarily unavailable because "
                "the model is experiencing high demand. "
                "Please try again in a few moments."
            )

        # -----------------------------------------------------
        # 500
        # -----------------------------------------------------

        if error_code == 500:
            return (
                "Gemini encountered a temporary server error. "
                "Please try again."
            )

        # -----------------------------------------------------
        # 504
        # -----------------------------------------------------

        if error_code == 504:
            return (
                "Gemini request timed out. "
                "Please try again."
            )

        return error_text

    # =========================================================
    # GENERIC RETRY WRAPPER
    # =========================================================

    def _retry_call(
        self,
        function,
        *args,
        **kwargs
    ):

        last_error = None

        for attempt in range(
            self.max_retries
        ):

            try:

                return function(
                    *args,
                    **kwargs
                )

            except Exception as error:

                last_error = error

                print(
                    f"\nGemini API attempt "
                    f"{attempt + 1}/"
                    f"{self.max_retries} failed."
                )

                print(
                    f"Error: {error}"
                )

                # -------------------------------------------------
                # Permanent error / quota error
                # -------------------------------------------------

                if not self._is_retryable_error(
                    error
                ):

                    print(
                        "This error will NOT be retried."
                    )

                    raise

                # -------------------------------------------------
                # Last attempt
                # -------------------------------------------------

                if (
                    attempt
                    == self.max_retries - 1
                ):

                    print(
                        "Maximum Gemini retries reached."
                    )

                    raise

                # -------------------------------------------------
                # Exponential backoff
                #
                # attempt 1 -> 5 seconds
                # attempt 2 -> 10 seconds
                # -------------------------------------------------

                delay = 5 * (
                    2 ** attempt
                )

                print(
                    f"Retrying Gemini request "
                    f"in {delay} seconds..."
                )

                time.sleep(
                    delay
                )

        raise last_error

    # =========================================================
    # UPLOAD RESUME FILE TO GEMINI
    # =========================================================

    def upload_file(
        self,
        django_file
    ):

        suffix = os.path.splitext(
            django_file.name
        )[1]

        temp = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        )

        temp_path = temp.name

        try:

            # -------------------------------------------------
            # Copy Django uploaded file to temporary file
            # -------------------------------------------------

            for chunk in django_file.chunks():

                temp.write(
                    chunk
                )

            temp.close()

            # -------------------------------------------------
            # Upload file to Gemini
            # -------------------------------------------------

            print(
                f"Uploading resume to Gemini: "
                f"{django_file.name}"
            )

            uploaded = self._retry_call(
                self.client.files.upload,
                file=temp_path
            )

            print(
                f"Gemini uploaded file: "
                f"{uploaded.name}"
            )

            # -------------------------------------------------
            # Wait until Gemini finishes processing
            # -------------------------------------------------

            for attempt in range(60):

                file_info = self._retry_call(
                    self.client.files.get,
                    name=uploaded.name
                )

                state = getattr(
                    file_info,
                    "state",
                    None
                )

                state_name = str(
                    getattr(
                        state,
                        "name",
                        state
                    )
                ).upper()

                print(
                    f"Gemini file state: "
                    f"{state_name}"
                )

                # -------------------------------------------------
                # File ready
                # -------------------------------------------------

                if "ACTIVE" in state_name:

                    print(
                        "Gemini file is ACTIVE."
                    )

                    return file_info

                # -------------------------------------------------
                # File failed
                # -------------------------------------------------

                if "FAILED" in state_name:

                    raise ValueError(
                        "Gemini failed to process "
                        "the uploaded resume."
                    )

                # -------------------------------------------------
                # Still processing
                # -------------------------------------------------

                time.sleep(1)

            raise TimeoutError(
                "Gemini file processing timed out."
            )

        finally:

            # -------------------------------------------------
            # Delete temporary file
            # -------------------------------------------------

            try:

                os.unlink(
                    temp_path
                )

            except OSError:

                pass

    # =========================================================
    # GENERATE JSON FROM GEMINI
    # =========================================================

    def generate_json(
        self,
        prompt,
        uploaded_file
    ):

        def generate():

            return self.client.models.generate_content(

                model=self.model,

                contents=[
                    prompt,
                    uploaded_file
                ],

                config=types.GenerateContentConfig(

                    response_mime_type="application/json",

                    temperature=0.2,

                    max_output_tokens=8192
                )
            )

        try:

            # -------------------------------------------------
            # Call Gemini with retry
            # -------------------------------------------------

            response = self._retry_call(
                generate
            )

        except Exception as error:

            # -------------------------------------------------
            # Convert Gemini error to clean application error
            # -------------------------------------------------

            message = self._get_error_message(
                error
            )

            print(
                f"Gemini final error: {message}"
            )

            raise ValueError(
                message
            ) from error

        # -----------------------------------------------------
        # Empty response check
        # -----------------------------------------------------

        if not response:

            raise ValueError(
                "Gemini returned an empty response."
            )

        # -----------------------------------------------------
        # Get response text
        # -----------------------------------------------------

        text = getattr(
            response,
            "text",
            None
        )

        if not text:

            raise ValueError(
                "Gemini returned an empty text response."
            )

        text = text.strip()

        print(
            "Gemini response received successfully."
        )

        # =====================================================
        # PARSE JSON
        # =====================================================

        try:

            return json.loads(
                text
            )

        except json.JSONDecodeError:

            pass

        # -----------------------------------------------------
        # Remove markdown JSON fences
        # -----------------------------------------------------

        cleaned_text = (
            text
            .replace(
                "```json",
                ""
            )
            .replace(
                "```JSON",
                ""
            )
            .replace(
                "```",
                ""
            )
            .strip()
        )

        try:

            return json.loads(
                cleaned_text
            )

        except json.JSONDecodeError as error:

            print(
                "Gemini returned invalid JSON:"
            )

            print(
                text
            )

            raise ValueError(
                "Gemini returned invalid JSON."
            ) from error

    # =========================================================
    # ANALYZE RESUME
    # =========================================================

    def analyze_resume(
        self,
        django_file,
        job_description=""
    ):

        # -----------------------------------------------------
        # Upload resume
        # -----------------------------------------------------

        uploaded_file = self.upload_file(
            django_file
        )

        # -----------------------------------------------------
        # ATS analysis prompt
        # -----------------------------------------------------

        prompt = f"""

You are an expert ATS resume analyzer.

Analyze the uploaded resume carefully.

Target job description:

{job_description or "No specific job description provided."}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "ats_score": 0,

    "score_breakdown": {{
        "Keywords Match": 0,
        "Skills": 0,
        "Experience": 0,
        "Education": 0,
        "Formatting": 0
    }},

    "suggestions": [
        {{
            "title": "",
            "description": "",
            "impact": "High Impact"
        }}
    ],

    "analysis": {{
        "summary": "",
        "strengths": [],
        "weaknesses": [],
        "missing_keywords": [],
        "missing_skills": [],
        "formatting_issues": [],
        "experience_improvements": []
    }}
}}

Rules:

1. Every score must be between 0 and 100.

2. ats_score must be a realistic overall ATS score.

3. Compare the resume against the job description if provided.

4. Give at least 4 practical suggestions.

5. Suggestions must be actionable.

6. Do not invent candidate experience.

7. Do not invent education.

8. Do not invent companies.

9. Do not invent projects.

10. Do not invent skills.

11. Only recommend changes based on the uploaded resume
    and provided job description.

12. Preserve factual information from the resume.

13. Return valid JSON only.

14. Do not use markdown.

15. Do not wrap JSON inside markdown fences.

"""

        return self.generate_json(
            prompt,
            uploaded_file
        )

    # =========================================================
    # GENERATE OPTIMIZED RESUME
    # =========================================================

    def generate_resume(
        self,
        django_file,
        target_role,
        job_description
    ):

        # -----------------------------------------------------
        # Upload original resume
        # -----------------------------------------------------

        uploaded_file = self.upload_file(
            django_file
        )

        # -----------------------------------------------------
        # Resume generation prompt
        # -----------------------------------------------------

        prompt = f"""

You are an expert professional resume writer.

Create an ATS-friendly resume using the uploaded
candidate resume as the source.

Target role:

{target_role}

Job description:

{job_description}

Important rules:

- Do not invent companies.
- Do not invent degrees.
- Do not invent years.
- Do not invent projects.
- Do not invent skills that are not reasonably supported.
- Do not create fake experience.
- Do not create fake achievements.
- Do not create fake certifications.
- Do not create fake education.
- Preserve factual information from the source resume.
- Improve wording and keyword alignment.
- Keep achievements measurable where the source provides numbers.
- Use professional concise language.
- Optimize for ATS.
- Match the target job description where supported by
  the candidate's actual resume.
- Never claim the candidate has experience that is not
  present in the source resume.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "full_name": "",

    "headline": "",

    "email": "",

    "phone": "",

    "location": "",

    "summary": "",

    "skills": [],

    "experience": [
        {{
            "company": "",
            "position": "",
            "start_date": "",
            "end_date": "",
            "achievements": []
        }}
    ],

    "education": [
        {{
            "degree": "",
            "institution": "",
            "year": ""
        }}
    ],

    "projects": [
        {{
            "name": "",
            "description": "",
            "technologies": []
        }}
    ],

    "certifications": [],

    "ats_score": 0
}}

Rules:

1. Return valid JSON only.

2. Do not use markdown.

3. Do not wrap JSON inside markdown fences.

4. Do not invent candidate information.

5. Do not invent experience.

6. Do not invent achievements.

7. Do not invent companies.

8. Do not invent degrees.

9. Do not invent projects.

10. Do not invent certifications.

11. ats_score must be between 0 and 100.

12. Preserve factual information from the source resume.

"""

        return self.generate_json(
            prompt,
            uploaded_file
        )