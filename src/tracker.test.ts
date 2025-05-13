import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tracker } from "./tracker";

describe("Tracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("constructor", () => {
    it("should create an instance with default options", () => {
      const tracker = new Tracker({});
      expect(tracker).toBeInstanceOf(Tracker);
    });

    it("should create an instance with custom options", () => {
      const generateId = vi.fn().mockReturnValue("custom-id");
      const onCreate = vi.fn();
      const onSubmit = vi.fn();

      const tracker = new Tracker({ generateId, onCreate, onSubmit });
      expect(tracker).toBeInstanceOf(Tracker);
    });
  });

  describe("create", () => {
    it("should create a record with custom ID generator", () => {
      const generateId = vi.fn().mockReturnValue("custom-id");
      const tracker = new Tracker({ generateId });
      const record = tracker.create("pageView");

      expect(generateId).toHaveBeenCalled();
      expect(record).toEqual({
        id: "custom-id",
        type: "pageView",
        createdAt: Date.now(),
      });
    });

    it("should call onCreate handler when creating a record", () => {
      const onCreate = vi.fn();
      const tracker = new Tracker({ onCreate });
      const record = tracker.create("pageView");

      expect(onCreate).toHaveBeenCalledWith(record);
    });
  });

  describe("getRecord", () => {
    it("should return null for non-existent type", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const tracker = new Tracker({});
      const result = tracker.getRecord("pageView", "some-id");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "No records found for type pageView"
      );
    });

    it("should return null for non-existent record id", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const tracker = new Tracker({});
      tracker.create("pageView");
      const result = tracker.getRecord("pageView", "non-existent-id");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Record with id non-existent-id not found for type pageView"
      );
    });

    it("should return the record if it exists", () => {
      const tracker = new Tracker({});
      const createdRecord = tracker.create("pageView");
      const retrievedRecord = tracker.getRecord("pageView", createdRecord.id);

      expect(retrievedRecord).toEqual(createdRecord);
    });
  });

  describe("submit", () => {
    it("should submit a record by ID and remove it", () => {
      const onSubmit = vi.fn();
      const tracker = new Tracker<{ pageView: { url: string } }>({ onSubmit });
      const record = tracker.create("pageView");

      tracker.submit("pageView", { url: "/home" }, record.id);

      expect(onSubmit).toHaveBeenCalledWith({
        ...record,
        submittedAt: Date.now(),
        data: { url: "/home" },
      });

      expect(tracker.getRecord("pageView", record.id)).toBeNull();
    });

    it("should submit a record by record object and remove it", () => {
      const onSubmit = vi.fn();
      const tracker = new Tracker<{ pageView: { url: string } }>({ onSubmit });
      const record = tracker.create("pageView");

      tracker.submit("pageView", { url: "/home" }, record);

      expect(onSubmit).toHaveBeenCalledWith({
        ...record,
        submittedAt: Date.now(),
        data: { url: "/home" },
      });

      expect(tracker.getRecord("pageView", record.id)).toBeNull();
    });

    it("should submit all records of a type when no ID is provided", () => {
      const onSubmit = vi.fn();
      const tracker = new Tracker<{ pageView: { url: string } }>({ onSubmit });
      const record1 = tracker.create("pageView");
      const record2 = tracker.create("pageView");

      tracker.submit("pageView", { url: "/home" });

      expect(onSubmit).toHaveBeenCalledTimes(2);
      expect(tracker.getRecord("pageView", record1.id)).toBeNull();
      expect(tracker.getRecord("pageView", record2.id)).toBeNull();
    });

    it("should log warning when submitting with non-existent ID", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const onSubmit = vi.fn();
      const tracker = new Tracker<{ pageView: { url: string } }>({ onSubmit });

      tracker.submit("pageView", { url: "/home" }, "non-existent-id");

      expect(onSubmit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Record with id non-existent-id not found for type pageView"
      );
    });

    it("should use type-specific submission handler if available", () => {
      const pageViewHandler = vi.fn();
      const clickHandler = vi.fn();

      const tracker = new Tracker({
        onSubmit: {
          pageView: pageViewHandler,
          click: clickHandler,
        },
      });

      const record = tracker.create("pageView");
      tracker.submit("pageView", { url: "/home" }, record.id);

      expect(pageViewHandler).toHaveBeenCalled();
      expect(clickHandler).not.toHaveBeenCalled();
    });
  });
});
