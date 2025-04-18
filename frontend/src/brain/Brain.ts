import {
  AllocateMemoryData,
  AllocateMemoryError,
  AllocateRequest,
  CheckHealthData,
  CompactMemoryData,
  GetMemoryStatusData,
  ReleaseMemoryData,
  ReleaseMemoryError,
  ReleaseRequest,
  ResetMemoryData,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Retrieve the current status of all memory blocks.
   *
   * @tags dbtn/module:allocator
   * @name get_memory_status
   * @summary Get Memory Status (STAT)
   * @request GET:/routes/status
   */
  get_memory_status = (params: RequestParams = {}) =>
    this.request<GetMemoryStatusData, any>({
      path: `/routes/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Request a contiguous block of memory for a process using a specified strategy.
   *
   * @tags dbtn/module:allocator
   * @name allocate_memory
   * @summary Request Memory Allocation (RQ)
   * @request POST:/routes/request
   */
  allocate_memory = (data: AllocateRequest, params: RequestParams = {}) =>
    this.request<AllocateMemoryData, AllocateMemoryError>({
      path: `/routes/request`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Release the memory block allocated to a specific process.
   *
   * @tags dbtn/module:allocator
   * @name release_memory
   * @summary Release Memory (RL)
   * @request POST:/routes/release
   */
  release_memory = (data: ReleaseRequest, params: RequestParams = {}) =>
    this.request<ReleaseMemoryData, ReleaseMemoryError>({
      path: `/routes/release`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Compact allocated memory blocks to consolidate free space.
   *
   * @tags dbtn/module:allocator
   * @name compact_memory
   * @summary Compact Memory (C)
   * @request POST:/routes/compact
   */
  compact_memory = (params: RequestParams = {}) =>
    this.request<CompactMemoryData, any>({
      path: `/routes/compact`,
      method: "POST",
      ...params,
    });

  /**
   * @description Reset the memory manager to its initial state (one large free block).
   *
   * @tags dbtn/module:allocator
   * @name reset_memory
   * @summary Reset Memory
   * @request POST:/routes/reset
   */
  reset_memory = (params: RequestParams = {}) =>
    this.request<ResetMemoryData, any>({
      path: `/routes/reset`,
      method: "POST",
      ...params,
    });
}
