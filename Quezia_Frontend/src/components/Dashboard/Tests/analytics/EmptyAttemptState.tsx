import React from 'react'

interface Props {
  onStart: () => void
}

const EmptyAttemptState: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm text-neutral-400">
        You haven’t attempted this test yet.
      </p>

      <button
        onClick={onStart}
        className="mt-4 rounded-lg bg-[#EC2801] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
      >
        Start Test
      </button>
    </div>
  )
}

export default EmptyAttemptState
