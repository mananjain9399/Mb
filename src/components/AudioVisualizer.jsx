export default function AudioVisualizer({ audioLevel, barCount = 24 }) {
  const bars = Array.from({ length: barCount }, (_, i) => {
    const distance = Math.abs(i - barCount / 2) / (barCount / 2);
    const height = Math.max(4, (1 - distance * 0.7) * audioLevel * 40 + Math.random() * 5);
    return height;
  });

  return (
    <div className="visualizer">
      {bars.map((h, i) => (
        <div
          key={i}
          className="visualizer__bar"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}
