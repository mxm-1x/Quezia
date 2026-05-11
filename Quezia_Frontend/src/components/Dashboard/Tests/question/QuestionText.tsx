import React from 'react'

type Props = {
  text: string
}

const QuestionText: React.FC<Props> = ({ text }) => {
  return (
    <div className="mb-8">
      <p className="text-base text-neutral-200 leading-relaxed">
        {text}
      </p>
    </div>
  )
}

export default QuestionText
