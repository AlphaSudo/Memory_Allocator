import {
  AllocateMemoryData,
  AllocateRequest,
  CheckHealthData,
  CompactMemoryData,
  GetMemoryStatusData,
  ReleaseMemoryData,
  ReleaseRequest,
  ResetMemoryData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Retrieve the current status of all memory blocks.
   * @tags dbtn/module:allocator
   * @name get_memory_status
   * @summary Get Memory Status (STAT)
   * @request GET:/routes/status
   */
  export namespace get_memory_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMemoryStatusData;
  }

  /**
   * @description Request a contiguous block of memory for a process using a specified strategy.
   * @tags dbtn/module:allocator
   * @name allocate_memory
   * @summary Request Memory Allocation (RQ)
   * @request POST:/routes/request
   */
  export namespace allocate_memory {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AllocateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AllocateMemoryData;
  }

  /**
   * @description Release the memory block allocated to a specific process.
   * @tags dbtn/module:allocator
   * @name release_memory
   * @summary Release Memory (RL)
   * @request POST:/routes/release
   */
  export namespace release_memory {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ReleaseRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ReleaseMemoryData;
  }

  /**
   * @description Compact allocated memory blocks to consolidate free space.
   * @tags dbtn/module:allocator
   * @name compact_memory
   * @summary Compact Memory (C)
   * @request POST:/routes/compact
   */
  export namespace compact_memory {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CompactMemoryData;
  }

  /**
   * @description Reset the memory manager to its initial state (one large free block).
   * @tags dbtn/module:allocator
   * @name reset_memory
   * @summary Reset Memory
   * @request POST:/routes/reset
   */
  export namespace reset_memory {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResetMemoryData;
  }
}
