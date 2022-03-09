function calcMean(arr) {
  if (arr.length === 0) {
    throw new Error("Input arr length === 0");
  }

  return arr.reduce((acc, el) => acc + el) / arr.length;
}

function calcMedian(arr) {
  if (arr.length === 0) {
    throw new Error("Input arr length === 0");
  }

  const sorted = [...arr].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function convertNsToMs(nanoSecs) {
  const nanoSecsInMilliSec = 1_000_000;

  return Number(nanoSecs) / nanoSecsInMilliSec;
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

module.exports = {
  calcMean,
  calcMedian,
  convertNsToMs,
  wait,
};
