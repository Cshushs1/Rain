# /// script
# requires-python = ">=3.10"
# dependencies = ["matplotlib"]
# ///

"""
Read 2026 Hong Kong daily rainfall data from data/,
make one picture, and save it to out/.

Run:
    uv run plot.py
"""

import csv
import datetime as dt
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.dates as mdates


FILE = "hko-daily-rainfall-2026.csv"
PICTURE = "rainfall-2026-ytd.png"

HERE = Path(__file__).parent
DATA = HERE / "data" / FILE
OUT = HERE / "out"


def rows(path):
    """Read the cleaned rainfall CSV produced by fetch.py."""

    kept = []

    with path.open(
        encoding="utf-8-sig",
        newline=""
    ) as handle:

        reader = csv.DictReader(handle)

        for row in reader:
            if row.get("date") and row.get("rainfall_mm"):
                kept.append(row)

    return kept


def main():

    table = rows(DATA)

    if not table:
        raise RuntimeError("No rainfall data found.")

    print(
        f"{DATA.name}: {len(table)} rows. "
        f"The first one: {table[0]}"
    )

    dates = []
    rainfall = []
    trace_days = 0

    for row in table:

        date = dt.datetime.strptime(
            row["date"],
            "%Y-%m-%d"
        )

        value = float(row["rainfall_mm"])

        dates.append(date)
        rainfall.append(value)

        if row.get("trace") == "yes":
            trace_days += 1

    print(
        f"{len(rainfall)} daily observations, "
        f"from {min(rainfall):.1f} to {max(rainfall):.1f} mm"
    )

    print(f"{trace_days} trace-rainfall days")

    total = sum(rainfall)

    rainy_days = sum(
        1
        for value in rainfall
        if value > 0
    )

    print(f"Total recorded rainfall: {total:.1f} mm")
    print(f"Days with measurable rainfall: {rainy_days}")

    # Find wettest day
    max_index = rainfall.index(max(rainfall))
    wettest_date = dates[max_index]
    wettest_value = rainfall[max_index]

    print(
        f"Wettest day: "
        f"{wettest_date:%Y-%m-%d}, "
        f"{wettest_value:.1f} mm"
    )

    # ------------------------------------------------------------
    # Plot
    # ------------------------------------------------------------

    fig, ax = plt.subplots(figsize=(12, 5))

    ax.plot(
        dates,
        rainfall,
        linewidth=1.2
    )

    ax.fill_between(
        dates,
        rainfall,
        0,
        alpha=0.15
    )

    # Mark wettest day
    ax.scatter(
        wettest_date,
        wettest_value,
        s=45,
        zorder=3
    )

    ax.annotate(
        f"Wettest day\n"
        f"{wettest_date:%d %b}\n"
        f"{wettest_value:.1f} mm",
        xy=(wettest_date, wettest_value),
        xytext=(20, 20),
        textcoords="offset points",
        fontsize=9,
        arrowprops={
            "arrowstyle": "->",
            "linewidth": 0.8
        }
    )

    # Monthly x-axis
    ax.xaxis.set_major_locator(
        mdates.MonthLocator()
    )

    ax.xaxis.set_major_formatter(
        mdates.DateFormatter("%b")
    )

    ax.set_xlabel("2026")
    ax.set_ylabel("Daily rainfall (mm)")

    ax.set_title(
        "Hong Kong Rainfall — 2026 Year to Date"
    )

    ax.grid(
        axis="y",
        alpha=0.2
    )

    fig.tight_layout()

    # ------------------------------------------------------------
    # Save
    # ------------------------------------------------------------

    OUT.mkdir(exist_ok=True)

    fig.savefig(
        OUT / PICTURE,
        dpi=150,
        bbox_inches="tight"
    )

    print(f"saved out/{PICTURE}")

    plt.show()


if __name__ == "__main__":
    main()