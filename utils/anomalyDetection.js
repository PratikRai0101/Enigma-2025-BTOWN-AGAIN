export function anomalyDetection(data) {
  const anomalies = [];
  const digitCounts = {};

  data.forEach((value) => {
    digitCounts[value] = (digitCounts[value] || 0) + 1;
  });

  for (const [digit, count] of Object.entries(digitCounts)) {
    if (count > 3) {
      anomalies.push({ digit, count });
    }
  }

  return anomalies;
}
