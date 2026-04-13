from datetime import date


def age_from_date_of_birth(dob_str: str) -> int:
    """Full years since DOB (YYYY-MM-DD), clamped 0–120."""
    parts = dob_str.strip().split("-")
    if len(parts) < 3:
        raise ValueError("dateOfBirth must be YYYY-MM-DD")
    y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
    born = date(y, m, d)
    today = date.today()
    age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    return max(0, min(120, age))
