import dataclasses
from typing import List, Optional, Literal, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field # Add pydantic import

# --- Data Structures ---

@dataclasses.dataclass
class MemoryBlock:
    """Represents a block of memory, either allocated or free."""
    start_address: int
    size: int
    process_id: Optional[str] = None  # None if the block is free

    @property
    def end_address(self) -> int:
        """End address is exclusive (like Python slicing: [start:end))."""
        return self.start_address + self.size

    @property
    def is_free(self) -> bool:
        """Check if the block is free."""
        return self.process_id is None

# --- Memory Management Logic ---

class MemoryManager:
    """Manages the overall memory space and allocation logic (Python Simulation)."""
    def __init__(self, total_memory_size: int):
        if total_memory_size <= 0:
            raise ValueError("Total memory size must be positive.")
        self.total_memory_size = total_memory_size
        # Initialize with one large free block
        self.blocks: List[MemoryBlock] = [
            MemoryBlock(start_address=0, size=total_memory_size)
        ]
        print(f"[MemoryManager] Initialized with {total_memory_size} bytes. State: {self.get_status()}")

    def _sort_blocks(self):
        """Keeps blocks sorted by start address."""
        self.blocks.sort(key=lambda block: block.start_address)

    def allocate(self, process_id: str, requested_size: int, strategy: Literal['F', 'B', 'W']) -> bool:
        """Allocate memory using the specified strategy. Returns True on success, False on failure."""
        if requested_size <= 0:
            print(f"[MemoryManager] Error: Requested size ({requested_size}) must be positive for P_ID {process_id}.")
            return False

        print(f"[MemoryManager] Attempting allocation: P_ID={process_id}, Size={requested_size}, Strategy={strategy}")

        # --- Allocation Logic Implementation Needed ---
        # TODO: Implement First Fit (F), Best Fit (B), Worst Fit (W)
        
        # Find a suitable free block based on strategy
        candidate_block_index = self._find_allocation_candidate(requested_size, strategy)

        if candidate_block_index is None:
            print(f"[MemoryManager] Allocation Failed: No suitable hole found for P_ID {process_id} (Size: {requested_size}, Strategy: {strategy}).")
            raise ValueError(f"Insufficient contiguous memory available for {requested_size} bytes using {strategy} strategy.")

        # Allocate the block
        block_to_allocate = self.blocks[candidate_block_index]
        print(f"[MemoryManager] Found candidate block: Start={block_to_allocate.start_address}, Size={block_to_allocate.size}")

        # Check if the block needs to be split
        remaining_size = block_to_allocate.size - requested_size
        
        if remaining_size > 0:
            # Split the block: modify the original and add a new free block
            print(f"[MemoryManager] Splitting block. New free block: Start={block_to_allocate.start_address + requested_size}, Size={remaining_size}")
            block_to_allocate.size = requested_size
            block_to_allocate.process_id = process_id
            
            new_free_block = MemoryBlock(
                start_address=block_to_allocate.end_address, # Use property for clarity
                size=remaining_size,
                process_id=None
            )
            # Insert the new free block right after the allocated one
            self.blocks.insert(candidate_block_index + 1, new_free_block)
            
        elif remaining_size == 0:
            # Allocate the entire block, no split needed
            print("[MemoryManager] Allocating entire block.")
            block_to_allocate.process_id = process_id
        else:
             # This case should technically not be reached if _find_allocation_candidate works correctly
             print("[MemoryManager] Error: Negative remaining size during allocation. This should not happen.")
             return False


        self._sort_blocks() # Ensure list remains sorted
        print(f"[MemoryManager] Allocation Successful: P_ID {process_id} allocated {requested_size} bytes at address {block_to_allocate.start_address}.")
        print(f"[MemoryManager] Current State: {self.get_status()}")
        return True

    def _find_allocation_candidate(self, requested_size: int, strategy: Literal['F', 'B', 'W']) -> Optional[int]:
        """Finds the index of a suitable free block based on the strategy."""
        free_blocks_with_indices = [
            (i, block) for i, block in enumerate(self.blocks) 
            if block.is_free and block.size >= requested_size
        ]

        if not free_blocks_with_indices:
            return None # No suitable block found

        if strategy == 'F': # First Fit
            # Blocks are already sorted by address, so the first suitable one is the first fit.
            # We just need the index from the original list.
            print("[MemoryManager] Strategy: First Fit")
            return free_blocks_with_indices[0][0] 
            
        elif strategy == 'B': # Best Fit
             print("[MemoryManager] Strategy: Best Fit")
             # Find the smallest suitable block (minimum size difference)
             best_fit = min(free_blocks_with_indices, key=lambda item: item[1].size)
             return best_fit[0]

        elif strategy == 'W': # Worst Fit
            print("[MemoryManager] Strategy: Worst Fit")
            # Find the largest suitable block
            worst_fit = max(free_blocks_with_indices, key=lambda item: item[1].size)
            return worst_fit[0]
            
        else:
             # Should not happen with Literal type hint, but good practice
             print(f"[MemoryManager] Error: Unknown allocation strategy '{strategy}'.")
             return None


    def release(self, process_id: str) -> bool:
        """Release memory allocated to a specific process. Returns True on success, False if process not found."""
        print(f"[MemoryManager] Attempting release for P_ID {process_id}")
        found_block_index = -1
        for i, block in enumerate(self.blocks):
            if block.process_id == process_id:
                found_block_index = i
                break

        if found_block_index == -1:
            print(f"[MemoryManager] Release Failed: P_ID {process_id} not found.")
            return False

        # Mark the block as free
        released_block = self.blocks[found_block_index]
        print(f"[MemoryManager] Releasing block: Start={released_block.start_address}, Size={released_block.size}")
        released_block.process_id = None

        # Merge adjacent free blocks
        self._merge_holes()

        print(f"[MemoryManager] Release Successful: P_ID {process_id}.")
        print(f"[MemoryManager] Current State: {self.get_status()}")
        return True

    def _merge_holes(self):
        """Merges adjacent free blocks."""
        if len(self.blocks) < 2: # Cant merge if less than 2 blocks
             return 
             
        print("[MemoryManager] Checking for holes to merge...")
        merged_blocks: List[MemoryBlock] = []
        # Start with a copy of the first block
        current_block = dataclasses.replace(self.blocks[0]) # Use replace to avoid modifying original during iteration
        
        merged_occurred = False

        for i in range(1, len(self.blocks)):
            next_block = self.blocks[i]
            # Check if current and next are both free and physically adjacent
            if current_block.is_free and next_block.is_free and current_block.end_address == next_block.start_address:
                # Merge next_block into current_block
                print(f"[MemoryManager] Merging free blocks: [{current_block.start_address}:{current_block.end_address}) + [{next_block.start_address}:{next_block.end_address})")
                current_block.size += next_block.size
                merged_occurred = True
                print(f"[MemoryManager]   -> Merged block: [{current_block.start_address}:{current_block.end_address}) Size={current_block.size}")
            else:
                # No merge possible with the *next* block. 
                # Add the current_block (which might itself be a result of previous merges) to our results list.
                merged_blocks.append(current_block)
                # The next_block becomes the new current_block for the next iteration.
                current_block = dataclasses.replace(next_block) # Start fresh with a copy

        # Always add the last processed block to the results
        merged_blocks.append(current_block)

        if merged_occurred:
             self.blocks = merged_blocks
             self._sort_blocks() # Ensure sorted after potential merges
             print("[MemoryManager] Hole merging complete.")
        else:
             print("[MemoryManager] No adjacent holes found to merge.")


    def compact(self) -> None:
        """Compact memory by moving allocated blocks to the start and creating one large free block."""
        print("[MemoryManager] Starting memory compaction...")
        
        # Filter out allocated blocks and sort them (though they should already be sorted)
        allocated_blocks = sorted(
            [block for block in self.blocks if not block.is_free],
            key=lambda b: b.start_address
        )
        
        compacted_blocks: List[MemoryBlock] = []
        current_address = 0
        total_allocated_size = 0
        
        if not allocated_blocks: # Handle case with no allocated blocks
             print("[MemoryManager] No allocated blocks to compact. Resetting to single free block.")
             self.blocks = [MemoryBlock(start_address=0, size=self.total_memory_size)]
             return

        # Move allocated blocks to the beginning
        for block in allocated_blocks:
            if block.start_address != current_address:
                print(f"[MemoryManager]   Moving P_ID {block.process_id}: From {block.start_address} -> {current_address}")
                block.start_address = current_address
            else:
                 print(f"[MemoryManager]   P_ID {block.process_id} already at correct compact position: {current_address}")
            
            compacted_blocks.append(block)
            current_address += block.size
            total_allocated_size += block.size

        # Add the single large free block at the end if there's remaining space
        free_size = self.total_memory_size - total_allocated_size
        if free_size > 0:
            free_block = MemoryBlock(start_address=current_address, size=free_size)
            print(f"[MemoryManager]   Creating final free block: Start={free_block.start_address}, Size={free_block.size}")
            compacted_blocks.append(free_block)
        elif free_size < 0:
             # This indicates a bug in tracking sizes
             print(f"[MemoryManager] Error during compaction: Calculated negative free size ({free_size}). Total: {self.total_memory_size}, Allocated: {total_allocated_size}")
             # Fallback: just keep the compacted allocated blocks to avoid crashing
             # Consider raising an exception or handling this more robustly

        self.blocks = compacted_blocks
        self._sort_blocks() # Should already be sorted, but good practice
        print("[MemoryManager] Compaction complete.")
        print(f"[MemoryManager] Current State: {self.get_status()}")

    def get_status(self) -> List[Dict[str, Any]]:
        """Return the current status of memory blocks as a list of dictionaries."""
        self._sort_blocks() # Ensure sorted for reporting
        status_list = []
        for block in self.blocks:
            status_list.append({
                "start": block.start_address,
                "end": block.end_address, # Exclusive end
                "size": block.size,
                "status": f"Process {block.process_id}" if not block.is_free else "Unused",
                "process_id": block.process_id # Include process_id for allocated blocks
            })
        # Don't print here, let the API endpoint handle logging response generation
        # print("[MemoryManager] Generated memory status report.") 
        return status_list

# --- Global Memory Manager Instance ---
# TODO: Initialize this properly, perhaps via an API endpoint or configuration
# For now, initialize with a default size for testing within this module.
# This instance will be shared across API calls.
MEMORY_SIZE = 1048576 # Default 1MB, as per example requirement
memory_manager = MemoryManager(MEMORY_SIZE)

# --- API Router ---
router = APIRouter()

# --- Pydantic Models for API ---

class AllocateRequest(BaseModel):
    process_id: str = Field(..., description="Identifier for the process requesting memory")
    size: int = Field(..., gt=0, description="Size of the memory block requested (must be positive)")
    strategy: Literal['F', 'B', 'W'] = Field(..., description="Allocation strategy: F=First Fit, B=Best Fit, W=Worst Fit")

class ReleaseRequest(BaseModel):
    process_id: str = Field(..., description="Identifier for the process whose memory is to be released")

# Model matching the output structure of MemoryManager.get_status()
class MemoryBlockStatus(BaseModel):
    start: int
    end: int
    size: int
    status: str
    process_id: Optional[str]

class StatusResponse(BaseModel):
    memory_state: List[MemoryBlockStatus] = Field(..., description="Current state of all memory blocks")
    total_memory: int = Field(..., description="Total configured memory size")

class GeneralResponse(BaseModel):
    success: bool
    message: str
    # Optionally include the updated memory state in responses for easier frontend updates
    memory_state: Optional[List[MemoryBlockStatus]] = None
    total_memory: Optional[int] = None

# --- API Endpoints ---

@router.get("/status", response_model=StatusResponse, summary="Get Memory Status (STAT)")
def get_memory_status():
    """Retrieve the current status of all memory blocks."""
    print("API: Received request for /status")
    try:
        current_state = memory_manager.get_status()
        return StatusResponse(
            memory_state=current_state, 
            total_memory=memory_manager.total_memory_size
        )
    except Exception as e:
        print(f"API Error fetching status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error retrieving memory status.")

# Placeholder for other endpoints
# @router.post("/allocate", ...)
# def allocate_memory(...): ...

@router.post("/request", response_model=GeneralResponse, summary="Request Memory Allocation (RQ)")
def allocate_memory(request: AllocateRequest):
    """Request a contiguous block of memory for a process using a specified strategy."""
    print(f"API: Received request for /request: {request}")
    try:
        # Attempt allocation using the MemoryManager
        success = memory_manager.allocate(
            process_id=request.process_id,
            requested_size=request.size, # Corrected argument name
            strategy=request.strategy
        )
        
        # The MemoryManager.allocate method should ideally raise an exception on failure.
        # Let's adjust the logic based on that assumption or refine the manager method.
        # Assuming MemoryManager.allocate raises ValueError on failure:
        
        current_state = memory_manager.get_status()
        return GeneralResponse(
            success=True, 
            message=f"Memory successfully allocated for {request.process_id}",
            memory_state=current_state,
            total_memory=memory_manager.total_memory_size
        )

    except ValueError as e:
        # Catch allocation failures (e.g., insufficient memory, no suitable hole)
        print(f"API Error allocating memory: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Catch unexpected errors
        print(f"API Unexpected error during allocation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during memory allocation.")


# @router.post("/release", ...)
# def release_memory(...): ...

@router.post("/release", response_model=GeneralResponse, summary="Release Memory (RL)")
def release_memory(request: ReleaseRequest):
    """Release the memory block allocated to a specific process."""
    print(f"API: Received request for /release: {request}")
    try:
        memory_manager.release(process_id=request.process_id)
        current_state = memory_manager.get_status()
        return GeneralResponse(
            success=True, 
            message=f"Memory successfully released for {request.process_id}",
            memory_state=current_state,
            total_memory=memory_manager.total_memory_size
        )

    except ValueError as e:
        # Catch process not found errors
        print(f"API Error releasing memory: {e}")
        # Check if the error message indicates process not found
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        else:
            # Other potential ValueErrors from release logic?
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Catch unexpected errors
        print(f"API Unexpected error during release: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during memory release.")


# @router.post("/compact", ...)
# def compact_memory(...): ...

@router.post("/compact", response_model=GeneralResponse, summary="Compact Memory (C)")
def compact_memory():
    """Compact allocated memory blocks to consolidate free space."""
    print("API: Received request for /compact")
    try:
        memory_manager.compact()
        current_state = memory_manager.get_status()
        return GeneralResponse(
            success=True, 
            message="Memory successfully compacted.",
            memory_state=current_state,
            total_memory=memory_manager.total_memory_size
        )

    except Exception as e:
        # Catch unexpected errors during compaction
        print(f"API Unexpected error during compaction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during memory compaction.")

@router.post("/reset", response_model=GeneralResponse, summary="Reset Memory")
def reset_memory():
    """Reset the memory manager to its initial state (one large free block)."""
    global memory_manager # Need to modify the global instance
    print("API: Received request for /reset")
    try:
        original_size = memory_manager.total_memory_size # Get the original size before creating new one
        memory_manager = MemoryManager(original_size) # Re-initialize
        print(f"API: Memory reset to initial state with size {original_size}")
        current_state = memory_manager.get_status()
        return GeneralResponse(
            success=True,
            message="Memory manager successfully reset to initial state.",
            memory_state=current_state,
            total_memory=memory_manager.total_memory_size
        )
    except Exception as e:
        print(f"API Unexpected error during memory reset: {e}")
        # Attempt to restore a default state if possible?
        try:
             memory_manager = MemoryManager(MEMORY_SIZE) # Fallback to default if original_size failed?
             detail = "Internal server error during memory reset. Attempted fallback reset."
        except Exception as e2:
             print(f"API: Fallback reset also failed: {e2}")
             detail = "Critical internal server error during memory reset. Fallback failed."
        raise HTTPException(status_code=500, detail=detail)


print("Allocator API module loaded.")
