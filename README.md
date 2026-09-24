# Hong Kong Rainfall — 2026 Year to Date

![Hong Kong rainfall in 2026](out/rainfall-2026-ytd.png)

## The phenomenon

Rain is a very noticeable part of everyday life in Hong Kong. Since living here, I have noticed that the weather can change surprisingly quickly. A day can begin completely dry, but heavy rain can suddenly affect transportation, outdoor activities, and even simple daily plans.

This made me curious about what Hong Kong's rainfall actually looks like when it is viewed as data. Is rain spread relatively evenly across the year, or does most of it happen during a small number of intense periods?

Instead of only looking at the total amount of rainfall, I decided to look at each day of 2026 and use the changes over time to understand this pattern.

## The data

The data comes from the Hong Kong Observatory (HKO) and uses its official daily weather and climate records.

The rainfall data is stored in:

data/hko-daily-rainfall-2026.csv

Each row represents one day in 2026, with rainfall measured in millimetres (mm).

Source: Hong Kong Observatory — Daily Extract of Meteorological Observations

## From data to visualization

I used Python to collect, organize, and visualize the rainfall records.

fetch.py retrieves and prepares the rainfall data.

plot.py turns the cleaned data into a visualization and saves the result in the out/ folder.

The main information I chose to keep is simple:

date → rainfall amount

Other weather information, such as temperature, humidity, wind, and the causes of individual rain events, is intentionally left out. I wanted the project to focus specifically on the rhythm of rain over time.

## What I found

The visualization made one thing especially clear: rainfall in Hong Kong is not evenly distributed.

Many days have little or no rainfall, while a smaller number of days create very large spikes. In the current dataset, the highest daily rainfall is 122.6 mm on June 15.

Looking at the data day by day made this much more visible than simply reading a yearly rainfall total. The gaps between dry days and sudden heavy-rain days became part of the visual pattern itself.

## Interactive version

After creating the static visualization, I developed an interactive web version so the data could be explored rather than only viewed as a finished chart.

The website allows the rainfall pattern to be experienced across time and turns the dataset into a small interactive visual experience.

## Live Website

https://cshushs1.github.io/Rain/

## Run the project

Fetch and save the source data:

```bash
uv run fetch.py
```

Generate the visualization:

```bash
uv run plot.py
```

The raw data is stored in `data/`, and the generated visualization is saved in `out/`.

## Reflection

This project changed the way I thought about weather data. Rain was originally something I experienced through inconvenience—changing plans, carrying an umbrella, or suddenly getting caught outside. Turning those experiences into data showed me that the same phenomenon can also have a visible rhythm.

For me, the interesting part of the project was not only learning how to fetch and plot data, but deciding what information to keep, what to remove, and how interaction could make a simple dataset feel more connected to everyday experience.
