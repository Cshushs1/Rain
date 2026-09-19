/* =========================================================
   WHEN DOES HONG KONG GET WET?
   Interactive rainfall experience

   Data:
   data/hko-daily-rainfall-2026.csv

   Required columns:
   date,rainfall_mm,trace
========================================================= */


const DATA_URL =
  "data/hko-daily-rainfall-2026.csv";


/* =========================================================
   ELEMENTS
========================================================= */


const experience =
  document.getElementById(
    "rainExperience"
  );


const canvas =
  document.getElementById(
    "rainCanvas"
  );


const ctx =
  canvas.getContext("2d");


const timeline =
  document.getElementById(
    "timeline"
  );


const timelineCursor =
  document.getElementById(
    "timelineCursor"
  );


const monthLabels =
  document.getElementById(
    "monthLabels"
  );


const activeDate =
  document.getElementById(
    "activeDate"
  );


const activeRain =
  document.getElementById(
    "activeRain"
  );


const rainCondition =
  document.getElementById(
    "rainCondition"
  );


const unlockButton =
  document.getElementById(
    "unlockButton"
  );



/* =========================================================
   STATE
========================================================= */


let rainfallData = [];

let drops = [];

let splashes = [];


let activeIndex = 0;

let locked = false;


let currentRainfall = 0;

let targetRainfall = 0;


let canvasWidth = 0;

let canvasHeight = 0;

let pixelRatio =
  Math.min(
    window.devicePixelRatio || 1,
    2
  );


let lastFrame =
  performance.now();


/* slight horizontal direction */

let wind = -0.18;

let targetWind = -0.18;


let lastPointerX = 0;



/* =========================================================
   CSV PARSER
========================================================= */


function parseCSV(text) {

  const lines =
    text
      .trim()
      .split(/\r?\n/);


  if (lines.length < 2) {
    return [];
  }


  const headers =
    lines[0]
      .split(",")
      .map(value =>
        value.trim()
      );


  return lines
    .slice(1)
    .map(line => {

      const cells =
        line.split(",");


      const row = {};


      headers.forEach(
        (header, index) => {

          row[header] =
            cells[index]
              ?.trim() ?? "";

        }
      );


      const date =
        parseDate(
          row.date
        );


      const rainfall =
        Number(
          row.rainfall_mm
        );


      return {

        date,

        rainfall:
          Number.isFinite(rainfall)
            ? rainfall
            : 0,

        trace:
          row.trace
            .toLowerCase()
            === "yes"

      };

    })
    .filter(item =>
      item.date !== null
    );

}



/* =========================================================
   DATE
========================================================= */


function parseDate(value) {

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(value);


  if (!match) {
    return null;
  }


  return {

    year:
      Number(match[1]),

    month:
      Number(match[2]),

    day:
      Number(match[3])

  };

}



const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC"
];


const MONTHS_LONG = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER"
];



function formatDate(date) {

  return (
    `${String(date.day).padStart(2, "0")} ` +
    `${MONTHS_LONG[date.month - 1]} ` +
    `${date.year}`
  );

}



/* =========================================================
   LOAD
========================================================= */


async function loadData() {

  try {

    const response =
      await fetch(DATA_URL);


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const text =
      await response.text();


    rainfallData =
      parseCSV(text);


    if (
      rainfallData.length === 0
    ) {

      throw new Error(
        "No rainfall observations found."
      );

    }


    initialize();

  }

  catch (error) {

    console.error(error);


    activeDate.textContent =
      "DATA COULD NOT BE LOADED";


    rainCondition.textContent =
      "RUN THIS PAGE THROUGH LOCALHOST";

  }

}



/* =========================================================
   INITIALIZE
========================================================= */


function initialize() {

  updateSummary();

  buildTimeline();

  resizeCanvas();


  /*
     Start on first day.
  */

  setActiveDay(
    0,
    false
  );


  window.addEventListener(
    "resize",
    resizeCanvas
  );


  experience.addEventListener(
    "pointermove",
    handlePointerMove
  );


  experience.addEventListener(
    "pointerdown",
    handlePointerDown
  );


  unlockButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      unlockDay();

    }
  );


  requestAnimationFrame(
    animate
  );

}



/* =========================================================
   SUMMARY
========================================================= */


function updateSummary() {

  const days =
    rainfallData.length;


  const rainDays =
    rainfallData.filter(
      item =>
        item.rainfall > 0
    ).length;


  const total =
    rainfallData.reduce(
      (sum, item) =>
        sum + item.rainfall,
      0
    );


  const wettest =
    rainfallData.reduce(
      (maximum, item) =>

        item.rainfall >
        maximum.rainfall

          ? item
          : maximum

    );


  document
    .getElementById(
      "daysObserved"
    )
    .textContent =
      days;


  document
    .getElementById(
      "rainDays"
    )
    .textContent =
      rainDays;


  document
    .getElementById(
      "totalRain"
    )
    .textContent =
      total.toFixed(1);


  document
    .getElementById(
      "wettestRain"
    )
    .textContent =
      wettest.rainfall
        .toFixed(1);


  document
    .getElementById(
      "wettestDate"
    )
    .textContent =
      `${wettest.date.day} ` +
      `${MONTHS[wettest.date.month - 1]}`;


  const first =
    rainfallData[0].date;


  const last =
    rainfallData[
      rainfallData.length - 1
    ].date;


  document
    .getElementById(
      "period"
    )
    .textContent =
      `${first.day} ` +
      `${MONTHS[first.month - 1]} — ` +
      `${last.day} ` +
      `${MONTHS[last.month - 1]} ` +
      `${last.year}`;

}



/* =========================================================
   TIMELINE
========================================================= */


function buildTimeline() {

  /*
     Remove old bars if the
     function is ever called again.
  */

  timeline
    .querySelectorAll(
      ".timeline-bar"
    )
    .forEach(
      element =>
        element.remove()
    );


  monthLabels.innerHTML = "";


  const maximum =
    Math.max(
      ...rainfallData.map(
        item =>
          item.rainfall
      ),
      1
    );


  rainfallData.forEach(
    (item, index) => {

      const bar =
        document.createElement(
          "div"
        );


      bar.className =
        "timeline-bar";


      if (
        item.rainfall === 0
      ) {

        bar.classList.add(
          "zero"
        );

      }


      const left =
        index /
        Math.max(
          rainfallData.length - 1,
          1
        );


      const height =
        item.rainfall === 0

          ? 2

          : 4 +
            Math.sqrt(
              item.rainfall /
              maximum
            ) * 74;


      bar.style.left =
        `${left * 100}%`;


      bar.style.width =
        `${Math.max(
          100 /
          rainfallData.length *
          0.75,
          0.12
        )}%`;


      bar.style.height =
        `${height}px`;


      timeline.appendChild(
        bar
      );

    });


  /*
     Month labels.
  */

  const seen =
    new Set();


  rainfallData.forEach(
    (item, index) => {

      const month =
        item.date.month;


      if (
        seen.has(month)
      ) {
        return;
      }


      seen.add(month);


      const label =
        document.createElement(
          "span"
        );


      label.className =
        "month-label";


      label.textContent =
        MONTHS[month - 1];


      label.style.left =
        `${
          (
            index /
            Math.max(
              rainfallData.length - 1,
              1
            )
          ) * 100
        }%`;


      monthLabels.appendChild(
        label
      );

    });

}



/* =========================================================
   POINTER
========================================================= */


function handlePointerMove(event) {

  if (locked) {
    return;
  }


  const rect =
    experience
      .getBoundingClientRect();


  const x =
    Math.max(
      0,
      Math.min(
        event.clientX -
        rect.left,
        rect.width
      )
    );


  /*
     Cursor movement creates
     a small shift in rain angle.
  */

  const movement =
    x - lastPointerX;


  targetWind =
    Math.max(
      -1.5,
      Math.min(
        1.5,
        movement * 0.04
      )
    );


  lastPointerX = x;


  const ratio =
    rect.width > 0
      ? x / rect.width
      : 0;


  const index =
    Math.round(
      ratio *
      (
        rainfallData.length - 1
      )
    );


  setActiveDay(
    index,
    false
  );

}



function handlePointerDown(event) {

  /*
     Don't lock if user pressed
     the unlock button.
  */

  if (
    event.target ===
    unlockButton
  ) {
    return;
  }


  if (locked) {

    unlockDay();

    return;

  }


  locked = true;


  experience
    .classList
    .add("locked");


  unlockButton.hidden =
    false;


  rainCondition.textContent =
    conditionFor(
      rainfallData[
        activeIndex
      ],
      true
    );

}



/* =========================================================
   UNLOCK
========================================================= */


function unlockDay() {

  locked = false;


  experience
    .classList
    .remove("locked");


  unlockButton.hidden =
    true;


  rainCondition.textContent =
    conditionFor(
      rainfallData[
        activeIndex
      ],
      false
    );

}



/* =========================================================
   ACTIVE DAY
========================================================= */


function setActiveDay(
  index,
  force
) {

  if (
    locked &&
    !force
  ) {
    return;
  }


  index =
    Math.max(
      0,
      Math.min(
        rainfallData.length - 1,
        index
      )
    );


  activeIndex =
    index;


  const item =
    rainfallData[index];


  targetRainfall =
    item.rainfall;


  activeDate.textContent =
    formatDate(
      item.date
    );


  if (item.trace) {

    activeRain.textContent =
      "TRACE";

  }

  else {

    activeRain.textContent =
      item.rainfall
        .toFixed(1);

  }


  rainCondition.textContent =
    conditionFor(
      item,
      locked
    );


  const ratio =
    index /
    Math.max(
      rainfallData.length - 1,
      1
    );


  timelineCursor.style.left =
    `${ratio * 100}%`;


  const bars =
    timeline
      .querySelectorAll(
        ".timeline-bar"
      );


  bars.forEach(
    (bar, barIndex) => {

      bar.classList.toggle(
        "active",
        barIndex === index
      );

    });

}



/* =========================================================
   CONDITION
========================================================= */


function conditionFor(
  item,
  isLocked
) {

  let text;


  if (item.trace) {

    text =
      "TRACE RAINFALL";

  }

  else if (
    item.rainfall === 0
  ) {

    text =
      "NO MEASURABLE RAIN";

  }

  else if (
    item.rainfall < 5
  ) {

    text =
      "LIGHT RAIN";

  }

  else if (
    item.rainfall < 25
  ) {

    text =
      "RAIN";

  }

  else if (
    item.rainfall < 50
  ) {

    text =
      "HEAVY RAIN";

  }

  else {

    text =
      "INTENSE RAINFALL";

  }


  if (isLocked) {

    return (
      `${text} · DAY LOCKED`
    );

  }


  return text;

}



/* =========================================================
   CANVAS SIZE
========================================================= */


function resizeCanvas() {

  const rect =
    experience
      .getBoundingClientRect();


  canvasWidth =
    Math.max(
      1,
      rect.width
    );


  canvasHeight =
    Math.max(
      1,
      rect.height
    );


  pixelRatio =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  canvas.width =
    Math.round(
      canvasWidth *
      pixelRatio
    );


  canvas.height =
    Math.round(
      canvasHeight *
      pixelRatio
    );


  canvas.style.width =
    `${canvasWidth}px`;


  canvas.style.height =
    `${canvasHeight}px`;


  ctx.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0
  );

}



/* =========================================================
   RAIN DROP
========================================================= */


function createDrop(
  rainfall
) {

  /*
     Normalize rainfall.

     sqrt keeps medium rainfall
     visually distinct without
     allowing extreme rainfall
     to overwhelm everything.
  */

  const intensity =
    Math.min(
      1,
      Math.sqrt(
        Math.max(
          rainfall,
          0
        ) / 125
      )
    );


  const length =
    8 +
    intensity * 30 +
    Math.random() * 12;


  const speed =
    320 +
    intensity * 650 +
    Math.random() * 220;


  return {

    x:
      Math.random() *
      (
        canvasWidth + 100
      ) - 50,

    y:
      -Math.random() *
      canvasHeight,

    length,

    speed,

    opacity:
      0.18 +
      intensity * 0.48 +
      Math.random() * 0.15,

    width:
      intensity > 0.65
        ? 1.25
        : 0.8,

    drift:
      wind *
      (
        50 +
        intensity * 80
      )

  };

}



/* =========================================================
   SPLASH
========================================================= */


function createSplash(
  x,
  y,
  strength
) {

  if (
    splashes.length > 70
  ) {
    return;
  }


  splashes.push({

    x,

    y,

    radius:
      1,

    opacity:
      Math.min(
        0.55,
        0.15 +
        strength * 0.35
      ),

    life:
      0,

    maxLife:
      0.25 +
      Math.random() * 0.18

  });

}



/* =========================================================
   TARGET DROP COUNT
========================================================= */


function desiredDropCount(
  rainfall
) {

  const item =
    rainfallData[
      activeIndex
    ];


  if (
    item &&
    item.trace &&
    rainfall <= 0.01
  ) {

    return 3;

  }


  if (
    rainfall <= 0.01
  ) {

    return 0;

  }


  /*
     Continuous mapping:
     rainfall amount becomes
     environmental density.
  */

  const normalized =
    Math.min(
      1,
      Math.sqrt(
        rainfall / 125
      )
    );


  return Math.round(
    12 +
    normalized * 260
  );

}



/* =========================================================
   UPDATE RAIN
========================================================= */


function updateRain(dt) {

  /*
     Smoothly move from one day's
     weather into the next.
  */

  currentRainfall +=
    (
      targetRainfall -
      currentRainfall
    ) *
    Math.min(
      1,
      dt * 5
    );


  wind +=
    (
      targetWind -
      wind
    ) *
    Math.min(
      1,
      dt * 3
    );


  /*
     Wind slowly returns
     toward default.
  */

  targetWind +=
    (
      -0.18 -
      targetWind
    ) *
    Math.min(
      1,
      dt * 1.5
    );


  const desired =
    desiredDropCount(
      currentRainfall
    );


  /*
     Add drops gradually.
  */

  if (
    drops.length <
    desired
  ) {

    const numberToAdd =
      Math.min(
        desired -
        drops.length,
        Math.ceil(
          dt * 180
        ) + 1
      );


    for (
      let i = 0;
      i < numberToAdd;
      i++
    ) {

      drops.push(
        createDrop(
          currentRainfall
        )
      );

    }

  }


  /*
     Remove excess drops.
  */

  if (
    drops.length >
    desired
  ) {

    drops.splice(
      0,
      Math.min(
        drops.length -
        desired,
        Math.ceil(
          dt * 130
        )
      )
    );

  }


  const strength =
    Math.min(
      1,
      currentRainfall /
      125
    );


  for (
    let i =
      drops.length - 1;
    i >= 0;
    i--
  ) {

    const drop =
      drops[i];


    drop.y +=
      drop.speed * dt;


    drop.x +=
      (
        wind * 90 +
        drop.drift
      ) * dt;


    /*
       Visual ground is above
       timeline area.
    */

    const ground =
      canvasHeight - 120;


    if (
      drop.y >
      ground
    ) {

      if (
        currentRainfall > 2 &&
        Math.random() <
        0.18 + strength * 0.35
      ) {

        createSplash(
          drop.x,
          ground,
          strength
        );

      }


      /*
         Recycle.
      */

      drop.x =
        Math.random() *
        (
          canvasWidth + 100
        ) - 50;


      drop.y =
        -Math.random() * 120;


      const replacement =
        createDrop(
          currentRainfall
        );


      drop.length =
        replacement.length;


      drop.speed =
        replacement.speed;


      drop.opacity =
        replacement.opacity;


      drop.width =
        replacement.width;


      drop.drift =
        replacement.drift;

    }

  }

}



/* =========================================================
   UPDATE SPLASHES
========================================================= */


function updateSplashes(dt) {

  for (
    let i =
      splashes.length - 1;
    i >= 0;
    i--
  ) {

    const splash =
      splashes[i];


    splash.life += dt;


    splash.radius +=
      dt * 28;


    if (
      splash.life >=
      splash.maxLife
    ) {

      splashes.splice(
        i,
        1
      );

    }

  }

}



/* =========================================================
   DRAW
========================================================= */


function draw() {

  ctx.clearRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );


  /*
     Darken the environment
     slightly as rainfall grows.
  */

  const atmosphere =
    Math.min(
      0.18,
      currentRainfall /
      125 * 0.18
    );


  if (
    atmosphere > 0
  ) {

    ctx.fillStyle =
      `rgba(25, 35, 42, ${atmosphere})`;


    ctx.fillRect(
      0,
      0,
      canvasWidth,
      canvasHeight
    );

  }


  /*
     Rain.
  */

  ctx.lineCap =
    "round";


  for (
    const drop of drops
  ) {

    const angle =
      wind * 7;


    ctx.beginPath();


    ctx.moveTo(
      drop.x,
      drop.y
    );


    ctx.lineTo(
      drop.x + angle,
      drop.y +
      drop.length
    );


    ctx.strokeStyle =
      `rgba(
        245,
        249,
        252,
        ${drop.opacity}
      )`;


    ctx.lineWidth =
      drop.width;


    ctx.stroke();

  }


  /*
     Splashes.
  */

  for (
    const splash of splashes
  ) {

    const progress =
      splash.life /
      splash.maxLife;


    const opacity =
      splash.opacity *
      (
        1 - progress
      );


    ctx.beginPath();


    ctx.ellipse(
      splash.x,
      splash.y,
      splash.radius * 1.8,
      splash.radius * 0.45,
      0,
      0,
      Math.PI * 2
    );


    ctx.strokeStyle =
      `rgba(
        245,
        249,
        252,
        ${opacity}
      )`;


    ctx.lineWidth =
      1;


    ctx.stroke();

  }

}



/* =========================================================
   ANIMATION
========================================================= */


function animate(time) {

  let dt =
    (
      time -
      lastFrame
    ) / 1000;


  lastFrame =
    time;


  /*
     Prevent giant animation jumps
     after changing browser tabs.
  */

  dt =
    Math.min(
      dt,
      0.04
    );


  updateRain(dt);

  updateSplashes(dt);

  draw();


  requestAnimationFrame(
    animate
  );

}



/* =========================================================
   START
========================================================= */


loadData();