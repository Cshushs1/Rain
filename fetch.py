# /// script
# requires-python = ">=3.10"
# ///

"""
Fetch Hong Kong Observatory daily rainfall data for 2026 year-to-date.

Source:
Hong Kong Observatory daily climate data

Run:
    uv run fetch.py

Output:
    data/hko-daily-rainfall-2026.csv
"""

from pathlib import Path
import csv
import datetime as dt
import json
import subprocess


YEAR = 2026

URL = f"https://www.hko.gov.hk/cis/individual_day/daily_{YEAR}.xml"

FILE = "hko-daily-rainfall-2026.csv"

HERE = Path(__file__).parent
DATA = HERE / "data"
OUTPUT = DATA / FILE


def download(url):
    """Download the HKO daily climate dataset using curl."""

    print("Fetching Hong Kong Observatory daily climate data...")
    print(url)

    result = subprocess.run(
        [
            "curl",
            "-L",
            "--fail",
            "--silent",
            "--show-error",
            "--max-time",
            "60",
            "-A",
            "SD5913 PolyU student",
            url,
        ],
        capture_output=True,
        check=True,
    )

    return result.stdout.decode("utf-8")


def find_rainfall(data):
    """
    Find the Daily Total Rainfall dataset (RF)
    inside the HKO daily climate data.
    """

    stations = data.get("stn", {}).get("data", [])

    for station in stations:

        # HKO data structures may identify the element
        # using slightly different keys.
        text = json.dumps(station, ensure_ascii=False).lower()

        if (
            '"rf"' in text
            or "rainfall" in text
            or "daily total rainfall" in text
        ):
            return station

    raise RuntimeError(
        "Could not find the rainfall (RF) dataset "
        "inside the HKO response."
    )


def extract_rows(rainfall):
    """Convert the HKO rainfall table into date/rainfall rows."""

    day_data = rainfall.get("dayData", [])

    rows = []

    for row in day_data:

        if not row:
            continue

        # First value is normally the day number.
        try:
            day = int(str(row[0]).strip())
        except (ValueError, TypeError):
            continue

        # Remaining values represent Jan → Dec.
        months = row[1:13]

        for month, raw_value in enumerate(months, start=1):

            value = str(raw_value).strip()

            # Empty value = data not available yet.
            if value in ("", "-", "--", "N/A", "null", "None"):
                continue

            # Check that this date actually exists.
            try:
                date = dt.date(YEAR, month, day)
            except ValueError:
                continue

            # Do not include future dates.
            if date > dt.date.today():
                continue

            # HKO uses "Trace" for very small rainfall.
            # Keep the original status while representing it
            # numerically as 0.0 mm for plotting.
            trace = value.lower() in ("trace", "tr")

            if trace:
                rainfall_mm = 0.0
            else:
                try:
                    rainfall_mm = float(value)
                except ValueError:
                    continue

            rows.append(
                {
                    "date": date.isoformat(),
                    "rainfall_mm": rainfall_mm,
                    "trace": "yes" if trace else "no",
                }
            )

    rows.sort(key=lambda row: row["date"])

    return rows


def main():

    DATA.mkdir(exist_ok=True)

    raw = download(URL)

    print("Downloaded HKO dataset.")

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as problem:
        raise RuntimeError(
            "The HKO response was not valid JSON."
        ) from problem

    rainfall = find_rainfall(data)

    rows = extract_rows(rainfall)

    if not rows:
        raise RuntimeError(
            "Rainfall dataset was found, "
            "but no daily rainfall values could be extracted."
        )

    with OUTPUT.open(
        "w",
        encoding="utf-8",
        newline=""
    ) as handle:

        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "date",
                "rainfall_mm",
                "trace",
            ],
        )

        writer.writeheader()
        writer.writerows(rows)

    rainy_days = sum(
        1
        for row in rows
        if row["rainfall_mm"] > 0
        or row["trace"] == "yes"
    )

    total_rainfall = sum(
        row["rainfall_mm"]
        for row in rows
    )

    wettest = max(
        rows,
        key=lambda row: row["rainfall_mm"]
    )

    print()
    print(f"Saved data/{FILE}")
    print(f"{len(rows)} daily observations")
    print(f"{rainy_days} rain/trace days")
    print(f"{total_rainfall:.1f} mm total rainfall")
    print(
        "Wettest day: "
        f"{wettest['date']} "
        f"({wettest['rainfall_mm']:.1f} mm)"
    )

    print()
    print("Next: uv run plot.py")


if __name__ == "__main__":
    main()