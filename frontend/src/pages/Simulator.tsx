

import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemoryVisualizer, MemoryBlockData } from 'components/MemoryVisualizer'; // Import the visualizer
import brain from "brain"; // Import brain client
import { 
    AllocateRequest, 
    ReleaseRequest, 
    StatusResponse, 
    GeneralResponse,
    MemoryBlockStatus // Assuming this is the correct name from types.ts
} from "types"; 
import { HttpResponse } from "brain/core";

interface HistoryEntry {
  id: number;
  type: 'command' | 'output' | 'error';
  text: string;
}

// --- Initial State ---
const INITIAL_TOTAL_MEMORY = 1048576; // 1MB example size
const initialMemoryState: MemoryBlockData[] = [
  {
    start: 0,
    end: INITIAL_TOTAL_MEMORY,
    size: INITIAL_TOTAL_MEMORY,
    status: 'Unused',
    process_id: null,
  },
];
// --- End Initial State ---


export default function Simulator() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [inputCommand, setInputCommand] = useState<string>('');
  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlockData[]>(initialMemoryState); // Add state for memory blocks
  const [totalMemory, setTotalMemory] = useState<number>(INITIAL_TOTAL_MEMORY); // Add state for total memory size
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to add entries to history
  const addHistoryEntry = (type: HistoryEntry['type'], text: string) => {
    setHistory(prev => [...prev, { id: Date.now() + Math.random(), type, text }]); // Add random number for potentially quick updates
  };

  // Scroll to bottom when history updates
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [history]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommandSubmit = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputCommand.trim() !== '') {
      const commandText = inputCommand.trim();
      addHistoryEntry('command', `allocator> ${commandText}`);
      setInputCommand(''); // Clear input immediately

      const parts = commandText.split(/\s+/).filter(p => p);
      const command = parts[0]?.toUpperCase();
      const args = parts.slice(1);

      try {
        switch (command) {
          case 'RQ': // Request Memory: RQ <process_id> <size> <strategy>
            if (args.length !== 3) {
              throw new Error("Usage: RQ <process_id> <size> <strategy(F/B/W)>");
            }
            const [pidRq, sizeStr, strategy] = args;
            const sizeRq = parseInt(sizeStr, 10);
            if (isNaN(sizeRq) || sizeRq <= 0) {
              throw new Error("Invalid size. Must be a positive number.");
            }
            if (!['F', 'B', 'W'].includes(strategy.toUpperCase())) {
              throw new Error("Invalid strategy. Use F, B, or W.");
            }
            const requestBodyRq: AllocateRequest = {
              process_id: pidRq,
              size: sizeRq,
              strategy: strategy.toUpperCase() as 'F' | 'B' | 'W',
            };
            const responseRq: HttpResponse<GeneralResponse> = await brain.allocate_memory(requestBodyRq);
            if (!responseRq.ok) {
                const errorData = await responseRq.json();
                throw new Error(errorData.detail || `API Error ${responseRq.status}: ${responseRq.statusText}`);
            }
            const dataRq: GeneralResponse = await responseRq.json();
            addHistoryEntry('output', dataRq.message);
            if (dataRq.memory_state) {
              // Convert API block status to frontend type if needed (assuming they match for now)
              setMemoryBlocks(dataRq.memory_state as MemoryBlockData[]);
            }
            if (dataRq.total_memory) setTotalMemory(dataRq.total_memory);
            break;

          case 'RL': // Release Memory: RL <process_id>
            if (args.length !== 1) {
              throw new Error("Usage: RL <process_id>");
            }
            const [pidRl] = args;
            const requestBodyRl: ReleaseRequest = { process_id: pidRl };
            const responseRl: HttpResponse<GeneralResponse> = await brain.release_memory(requestBodyRl);
            if (!responseRl.ok) {
                const errorData = await responseRl.json();
                throw new Error(errorData.detail || `API Error ${responseRl.status}: ${responseRl.statusText}`);
            }
            const dataRl: GeneralResponse = await responseRl.json();
            addHistoryEntry('output', dataRl.message);
            if (dataRl.memory_state) {
              setMemoryBlocks(dataRl.memory_state as MemoryBlockData[]);
            }
             if (dataRl.total_memory) setTotalMemory(dataRl.total_memory);
            break;

          case 'C': // Compact Memory
            if (args.length !== 0) {
              throw new Error("Usage: C (no arguments)");
            }
            const responseC: HttpResponse<GeneralResponse> = await brain.compact_memory();
            if (!responseC.ok) {
                const errorData = await responseC.json();
                throw new Error(errorData.detail || `API Error ${responseC.status}: ${responseC.statusText}`);
            }
            const dataC: GeneralResponse = await responseC.json();
            addHistoryEntry('output', dataC.message);
            if (dataC.memory_state) {
              setMemoryBlocks(dataC.memory_state as MemoryBlockData[]);
            }
            if (dataC.total_memory) setTotalMemory(dataC.total_memory);
            break;

          case 'STAT': // Status Report
            if (args.length !== 0) {
              throw new Error("Usage: STAT (no arguments)");
            }
            const responseStat: HttpResponse<StatusResponse> = await brain.get_memory_status();
             if (!responseStat.ok) {
                const errorData = await responseStat.json();
                throw new Error(errorData.detail || `API Error ${responseStat.status}: ${responseStat.statusText}`);
            }
            const dataStat: StatusResponse = await responseStat.json();
            // Update state
            setMemoryBlocks(dataStat.memory_state as MemoryBlockData[]);
            setTotalMemory(dataStat.total_memory);
            // Add a more detailed status to history (optional)
            addHistoryEntry('output', "Memory Status Updated (see visualization).");
            // Could format dataStat.memory_state for detailed text output here if needed
            break;

          case 'X': // Exit
            if (args.length !== 0) {
              throw new Error("Usage: X (no arguments)");
            }
            addHistoryEntry('output', "Exiting simulator session.");
            // Maybe disable input or navigate away? For now, just a message.
            break;
          
          case 'CLEAR': // Helper command to clear history
             if (args.length !== 0) {
              throw new Error("Usage: CLEAR (no arguments)");
            }
            setHistory([]);
            break;

          case 'HELP': // Display help information
            if (args.length !== 0) {
              throw new Error("Usage: HELP (no arguments)");
            }
            addHistoryEntry('output', 
`Available Commands:
  RQ <pid> <size> <F|B|W>  - Request memory (e.g., RQ P1 10000 F)
  RL <pid>               - Release memory (e.g., RL P1)
  C                      - Compact memory
  STAT                   - Show memory status report
  CLEAR                  - Clear this command history
  HELP                   - Show this help message
  RESET                  - Reset memory to initial state
  X                      - Exit simulator (currently just logs message)`
            );
            break;

          case 'RESET': // Reset memory
            if (args.length !== 0) {
              throw new Error("Usage: RESET (no arguments)");
            }
            const responseReset: HttpResponse<GeneralResponse> = await brain.reset_memory();
            if (!responseReset.ok) {
                const errorData = await responseReset.json();
                throw new Error(errorData.detail || `API Error ${responseReset.status}: ${responseReset.statusText}`);
            }
            const dataReset: GeneralResponse = await responseReset.json();
            addHistoryEntry('output', dataReset.message);
            if (dataReset.memory_state) {
              setMemoryBlocks(dataReset.memory_state as MemoryBlockData[]);
            }
            if (dataReset.total_memory) setTotalMemory(dataReset.total_memory);
            break;

          default:
            throw new Error(`Unknown command: ${command}`);
        }
      } catch (error) {
        const message = (error instanceof Error) ? error.message : "An unknown error occurred";
        addHistoryEntry('error', `Error: ${message}`);
      }
      // Ensure input is focused after processing
      inputRef.current?.focus(); 
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-green-400 font-mono p-4">
      <h1 className="text-xl font-bold mb-2 border-b border-green-700 pb-1 text-center">Memory Allocator Simulation Terminal</h1>
      
      {/* --- Add Memory Visualizer Here --- */}
      <MemoryVisualizer blocks={memoryBlocks} totalMemorySize={totalMemory} />
      {/* --- End Memory Visualizer --- */}

      <ScrollArea className="flex-grow mb-2 border border-green-700 rounded p-2" ref={scrollAreaRef}>
        <div className="flex flex-col space-y-1">
          {history.map((entry) => (
            <div key={entry.id} className={`whitespace-pre-wrap ${entry.type === 'error' ? 'text-red-500' : entry.type === 'command' ? 'text-green-400' : 'text-gray-400'}`}>
              {entry.text}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center border-t border-green-700 pt-2">
        <span className="text-green-400 mr-2">allocator&gt;</span>
        <Input
          ref={inputRef}
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleCommandSubmit}
          className="flex-grow bg-black border-none text-green-400 focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 p-0 h-auto font-mono"
          placeholder="Enter command (e.g., RQ P1 100 F, RL P1, STAT, C, X)..."
          autoComplete="off"
        />
      </div>
    </div>
  );
}
