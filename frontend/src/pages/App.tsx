
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom"; // Import useNavigate

export default function App() {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleStartSimulation = () => {
    navigate("/Simulator"); // Navigate to simulator page
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center">
      <Card className="w-full max-w-4xl mb-8 border-neutral-700">
        <CardHeader className="border-b border-neutral-700 pb-4">
          <CardTitle className="text-3xl font-mono font-bold text-center text-primary">MemAllocator</CardTitle>
          <CardDescription className="text-center text-muted-foreground font-mono pt-2">
            A Contiguous Memory Allocation Simulator
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 font-mono">
          <p className="mb-6 text-lg leading-relaxed">
            Welcome to MemAllocator! This tool simulates how a computer's operating system manages a contiguous block of memory. Explore different allocation strategies and observe their impact on memory utilization and fragmentation.
          </p>

          <h2 className="text-2xl font-semibold mb-4 text-accent-foreground border-b border-neutral-700 pb-2">Core Concept: Contiguous Allocation</h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            In contiguous memory allocation, each process is assigned a single, continuous block (or chunk) of memory. The simulator starts with one large free block, and handles requests to allocate parts of this memory to processes and release it when processes finish.
          </p>

          <h2 className="text-2xl font-semibold mb-4 text-accent-foreground border-b border-neutral-700 pb-2">Allocation Strategies</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-neutral-700 bg-neutral-900">
              <CardHeader>
                <CardTitle className="font-mono text-lg text-primary">First Fit (F)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Scans memory from the beginning and chooses the first free hole that is large enough to accommodate the process's request.
              </CardContent>
            </Card>
            <Card className="border-neutral-700 bg-neutral-900">
              <CardHeader>
                <CardTitle className="font-mono text-lg text-primary">Best Fit (B)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Scans the entire list of free holes and chooses the smallest hole that is large enough for the process. Aims to minimize wasted space within a hole.
              </CardContent>
            </Card>
            <Card className="border-neutral-700 bg-neutral-900">
              <CardHeader>
                <CardTitle className="font-mono text-lg text-primary">Worst Fit (W)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Scans the entire list of free holes and chooses the largest hole. The idea is to leave a larger leftover hole, potentially more useful for future requests.
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={handleStartSimulation}
              className="font-mono text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Start Simulation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
