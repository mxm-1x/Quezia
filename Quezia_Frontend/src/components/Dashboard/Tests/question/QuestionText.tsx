import React from 'react'

type Props = {
  text: string
  diagramImage?: string
}

const QuestionText: React.FC<Props> = ({ text, diagramImage }) => {
  return (
    <div className="mb-8 flex flex-col gap-6">
      <p className="text-base text-neutral-200 leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
      
      {diagramImage && (
        <div className="bg-[var(--color-bg-subtle)] rounded-xl border border-[var(--color-border-default)] p-4 flex items-center justify-center overflow-hidden">
          <img 
            src={`data:image/png;base64,${diagramImage}`} 
            alt="Question Diagram" 
            className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  )
}

export default QuestionText
