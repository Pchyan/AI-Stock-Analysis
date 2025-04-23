import React from 'react';

interface AnalysisTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface AnalysisToolSelectorProps {
  tools: AnalysisTool[];
  selectedTool: string;
  onSelectTool: (id: string) => void;
  className?: string;
}

export default function AnalysisToolSelector({
  tools,
  selectedTool,
  onSelectTool,
  className = ''
}: AnalysisToolSelectorProps) {
  return (
    <div className={`analysis-tool-selector ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`card bg-base-100 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${
              selectedTool === tool.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectTool(tool.id)}
          >
            <div className="card-body p-4">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${selectedTool === tool.id ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content'}`}>
                  {tool.icon}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold">{tool.name}</h3>
                  <p className="text-sm text-base-content/70">{tool.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
