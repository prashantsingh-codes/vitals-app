import { useRef, useEffect } from "react";

export function WeightChart({ history, dark }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (!history.length || !window.Chart) return;
    const gridColor = dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)";
    const textColor = dark ? "#6B6358" : "#9A9386";
    chartRef.current = new window.Chart(canvasRef.current.getContext("2d"), {
      type: "line",
      data: {
        labels: history.map((h) => h.displayDate || h.date),
        datasets: [{ data: history.map((h) => h.value), borderColor: "#D4582A", backgroundColor: "rgba(212,88,42,.08)", borderWidth: 2, pointBackgroundColor: "#D4582A", pointBorderColor: dark ? "#1F1D19" : "#fff", pointBorderWidth: 2, pointRadius: 5, tension: 0.4, fill: true }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.y + "kg" } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 11 }, callback: (v) => v + "kg" } },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [history, dark]);

  if (!history.length) return <div style={{ textAlign: "center", color: "var(--text3)", padding: "20px 0", fontSize: 13 }}>No weight entries yet</div>;
  return <canvas ref={canvasRef} height={160} style={{ width: "100%" }} />;
}

export function MiniLineChart({ history, dark, color, unit, yCallback }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (!history.length || !window.Chart) return;
    const gridColor = dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)";
    const textColor = dark ? "#6B6358" : "#9A9386";
    chartRef.current = new window.Chart(canvasRef.current.getContext("2d"), {
      type: "line",
      data: {
        labels: history.map((h) => h.date),
        datasets: [{ data: history.map((h) => h.value), borderColor: color, backgroundColor: color + "14", borderWidth: 2, pointBackgroundColor: color, pointBorderColor: dark ? "#1F1D19" : "#fff", pointBorderWidth: 2, pointRadius: 4, tension: 0.4, fill: true }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.y + unit } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 10 }, maxTicksLimit: 7 } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 10 }, callback: yCallback || ((v) => v + unit) } },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [history, dark, color, unit]);

  if (!history.length) return null;
  return <canvas ref={canvasRef} height={130} style={{ width: "100%" }} />;
}
