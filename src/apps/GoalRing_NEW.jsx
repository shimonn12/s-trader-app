// --- Circular Progress Component (The Ring) ---
const GoalRing = ({ percentage }) => {
    const value = Math.max(0, Math.min(100, percentage));
    const size = 220;
    const stroke = 26;
    const notchWidth = 6;
    const bg = "#1e293b";
    const track = "#6B7280";
    const progress = "#10b981";
    const border = "#FFFFFF";

    const r = (size - stroke) / 2;
    const c = size / 2;
    const circ = 2 * Math.PI * r;
    const progLen = (circ * value) / 100;

    const notchX = c - notchWidth / 2;
    const notchY = c - r - stroke / 2;
    const notchH = stroke;

    const innerRingR = r - stroke / 2 - 18;

    return (
        <div style={{ width: size, height: size, position: "relative" }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={c}
                    cy={c}
                    r={r}
                    fill="none"
                    stroke={track}
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                />

                <circle
                    cx={c}
                    cy={c}
                    r={r}
                    fill="none"
                    stroke={progress}
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                    strokeDasharray={`${progLen} ${circ}`}
                    transform={`rotate(-90 ${c} ${c})`}
                    style={{ transition: "stroke-dasharray 300ms ease" }}
                />

                <circle
                    cx={c}
                    cy={c}
                    r={r + stroke / 2}
                    fill="none"
                    stroke={border}
                    strokeWidth={1.2}
                    opacity={0.9}
                />

                <circle
                    cx={c}
                    cy={c}
                    r={r - stroke / 2}
                    fill="none"
                    stroke={border}
                    strokeWidth={1.2}
                    opacity={0.9}
                />

                <circle
                    cx={c}
                    cy={c}
                    r={innerRingR}
                    fill="none"
                    stroke={border}
                    strokeWidth={1.2}
                    opacity={0.9}
                />

                <rect
                    x={notchX}
                    y={notchY}
                    width={notchWidth}
                    height={notchH}
                    fill={bg}
                    rx={1}
                />
            </svg>

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    fontFamily: "system-ui, Arial",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 44,
                            fontWeight: 800,
                            color: "#FFFFFF",
                            textShadow: "0 0 10px rgba(110,231,255,0.45)",
                            lineHeight: 1,
                        }}
                    >
                        {Math.round(value)}%
                    </div>
                    <div style={{ marginTop: 8, fontSize: 14, color: "#6EE7FF", opacity: 0.85 }}>
                        Completion
                    </div>
                </div>
            </div>
        </div>
    );
};
