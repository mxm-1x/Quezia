import React from 'react'

interface MiniLineGraphProps {
  data: number[]
  color: string
  height?: number
}

const MiniLineGraph: React.FC<MiniLineGraphProps> = ({
  data,
  color,
  height = 88,
}) => {
  const width = 320
  const paddingX = 14
  const paddingY = 10

  if (data.length === 0) {
    return (
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      />
    )
  }

  const min = Math.min(...data) - 2
  const max = Math.max(...data) + 2
  const plotWidth = width - paddingX * 2
  const plotHeight = height - paddingY * 2

  const getX = (index: number) => {
    if (data.length <= 1) return width / 2
    return paddingX + (index / (data.length - 1)) * plotWidth
  }

  const getY = (value: number) => {
    if (max === min) return height / 2
    return paddingY + ((max - value) / (max - min)) * plotHeight
  }

  const points = data.map((value, index) => ({
    x: getX(index),
    y: getY(value),
  }))

  const linePath = points
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ')

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : `M ${points[0].x} ${points[0].y} L ${points[0].x} ${height - paddingY} Z`

  const lastPoint = points[points.length - 1]
  const midY = height / 2

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <line
        x1={paddingX}
        x2={width - paddingX}
        y1={midY}
        y2={midY}
        stroke="var(--color-bg-muted)"
        strokeOpacity={0.4}
        strokeDasharray="4 4"
      />

      <path d={areaPath} fill={color} opacity={0.12} />

      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeOpacity={0.15}
      />

      <path d={linePath} fill="none" stroke={color} strokeWidth={2} />

      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={6}
        fill="var(--color-bg-base)"
        stroke={color}
        strokeWidth={2}
      />

      <circle cx={lastPoint.x} cy={lastPoint.y} r={2.5} fill={color} />
    </svg>
  )
}

export default MiniLineGraph
