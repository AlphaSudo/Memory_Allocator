import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define the structure of a memory block for the visualizer props
export interface MemoryBlockData {
  start: number;
  end: number; // Exclusive end address
  size: number;
  status: string; // e.g., "Unused" or "Process P1"
  process_id: string | null;
}

interface Props {
  blocks: MemoryBlockData[];
  totalMemorySize: number;
}

// Helper to get a color based on process ID or free status
const getBlockColor = (processId: string | null): string => {
  if (processId === null) {
    return 'bg-neutral-900'; // Free block color (dark gray/near black)
  }
  // Simple hashing to get a somewhat consistent color per process ID
  let hash = 0;
  for (let i = 0; i < processId.length; i++) {
    hash = processId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`; // Use HSL for varied colors
};

export function MemoryVisualizer({ blocks, totalMemorySize }: Props) {
  if (totalMemorySize <= 0) {
    return <div className="text-center text-red-500">Total memory size must be positive.</div>;
  }
  if (!blocks || blocks.length === 0) {
    return <div className="text-center text-gray-500">No memory blocks to display.</div>;
  }

  // Calculate total size represented by blocks to check consistency (optional)
  const sumOfBlockSizes = blocks.reduce((sum, block) => sum + block.size, 0);
  if (sumOfBlockSizes !== totalMemorySize) {
      console.warn(`MemoryVisualizer: Sum of block sizes (${sumOfBlockSizes}) does not match totalMemorySize (${totalMemorySize}). Display might be inaccurate.`);
      // Decide how to handle this - maybe scale based on sumOfBlockSizes?
      // For now, we proceed using totalMemorySize for scaling.
  }


  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-full h-12 bg-neutral-800 border border-neutral-600 flex rounded overflow-hidden my-4">
        {blocks.map((block) => {
          const widthPercentage = (block.size / totalMemorySize) * 100;
          const color = getBlockColor(block.process_id);
          
          // Ensure minimum width for very small blocks to be visible/hoverable
          const minWidthStyle = widthPercentage < 1 ? { minWidth: '4px' } : {}; 

          return (
            <Tooltip key={`block-${block.start}`}>
              <TooltipTrigger asChild>
                <div
                  className={`h-full flex items-center justify-center text-xs font-mono text-white overflow-hidden relative border-r border-neutral-900 last:border-r-0`}
                  style={{
                    width: `${widthPercentage}%`,
                    backgroundColor: color,
                    ...minWidthStyle,
                  }}
                >
                  {/* Display Process ID if block is large enough */}
                  {widthPercentage > 5 && block.process_id && (
                    <span className="truncate px-1 select-none">
                        {block.process_id}
                    </span>
                  )}
                  {/* Add subtle pattern for free blocks? (Optional) */}
                  {block.process_id === null && widthPercentage > 2 && (
                     <div className="absolute inset-0 bg-stripes opacity-30"></div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="font-mono bg-black text-white border-neutral-600">
                <p>Status: {block.status}</p>
                <p>Range: [{block.start} : {block.end})</p>
                <p>Size: {block.size} bytes</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Basic stripes pattern using CSS background
const styles = `
.bg-stripes {
  background-image: linear-gradient(45deg, rgba(0, 0, 0, 0.1) 25%, transparent 25%, transparent 50%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.1) 75%, transparent 75%, transparent);
  background-size: 10px 10px;
}
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);