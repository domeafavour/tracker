import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("should initialize with default value", () => {
    const { result } = renderHook(() => useCounter());
    const [count] = result.current;
    expect(count).toBe(0);
  });

  it("should initialize with provided value", () => {
    const { result } = renderHook(() => useCounter(10));
    const [count] = result.current;
    expect(count).toBe(10);
  });

  it("should increment the count", () => {
    const { result } = renderHook(() => useCounter());
    const [, { increment }] = result.current;

    act(() => {
      increment();
    });

    const [count] = result.current;
    expect(count).toBe(1);
  });

  it("should decrement the count", () => {
    const { result } = renderHook(() => useCounter());
    const [, { decrement }] = result.current;

    act(() => {
      decrement();
    });

    const [count] = result.current;
    expect(count).toBe(-1);
  });

  it("should reset the count", () => {
    const { result } = renderHook(() => useCounter(5));
    const [, { increment, reset }] = result.current;

    act(() => {
      increment();
      reset();
    });

    const [count] = result.current;
    expect(count).toBe(5);
  });
});
