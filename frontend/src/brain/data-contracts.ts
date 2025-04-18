/** AllocateRequest */
export interface AllocateRequest {
  /**
   * Process Id
   * Identifier for the process requesting memory
   */
  process_id: string;
  /**
   * Size
   * Size of the memory block requested (must be positive)
   * @exclusiveMin 0
   */
  size: number;
  /**
   * Strategy
   * Allocation strategy: F=First Fit, B=Best Fit, W=Worst Fit
   */
  strategy: "F" | "B" | "W";
}

/** GeneralResponse */
export interface GeneralResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Memory State */
  memory_state?: MemoryBlockStatus[] | null;
  /** Total Memory */
  total_memory?: number | null;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** MemoryBlockStatus */
export interface MemoryBlockStatus {
  /** Start */
  start: number;
  /** End */
  end: number;
  /** Size */
  size: number;
  /** Status */
  status: string;
  /** Process Id */
  process_id: string | null;
}

/** ReleaseRequest */
export interface ReleaseRequest {
  /**
   * Process Id
   * Identifier for the process whose memory is to be released
   */
  process_id: string;
}

/** StatusResponse */
export interface StatusResponse {
  /**
   * Memory State
   * Current state of all memory blocks
   */
  memory_state: MemoryBlockStatus[];
  /**
   * Total Memory
   * Total configured memory size
   */
  total_memory: number;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export type GetMemoryStatusData = StatusResponse;

export type AllocateMemoryData = GeneralResponse;

export type AllocateMemoryError = HTTPValidationError;

export type ReleaseMemoryData = GeneralResponse;

export type ReleaseMemoryError = HTTPValidationError;

export type CompactMemoryData = GeneralResponse;

export type ResetMemoryData = GeneralResponse;
