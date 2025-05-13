import { defaultIdGenerator } from "./defaultIdGenerator";
import type {
  StringKeyOf,
  TrackingInitialRecord,
  TrackingSubmissionHandlers,
  TrackingSubmitRecord,
} from "./typings";

export class Tracker<P extends Record<string, any> = Record<string, any>> {
  private initializedRecords = new Map<
    StringKeyOf<P>,
    Map<string, TrackingInitialRecord<StringKeyOf<P>>>
  >();

  constructor(
    private readonly options: {
      generateId?: () => string;
      onCreate?: (record: TrackingInitialRecord<StringKeyOf<P>>) => void;
      onSubmit?:
        | ((record: TrackingSubmitRecord<P>) => void)
        | TrackingSubmissionHandlers<P>;
    }
  ) {}

  private ensureTypeRecords(type: StringKeyOf<P>) {
    if (!this.initializedRecords.has(type)) {
      this.initializedRecords.set(type, new Map());
    }
    return this.initializedRecords.get(type)!;
  }

  private generateId() {
    return this.options.generateId?.() ?? defaultIdGenerator();
  }

  private triggerSubmit<K extends StringKeyOf<P>>({
    record,
    submittedAt,
    data,
    type,
  }: {
    record: TrackingInitialRecord<StringKeyOf<P>>;
    submittedAt: number;
    data: P[K];
    type: K;
  }) {
    const fn =
      typeof this.options.onSubmit === "function"
        ? this.options.onSubmit
        : this.options.onSubmit?.[type];
    fn?.({
      ...(record as TrackingInitialRecord<K>),
      submittedAt,
      data,
    });
  }

  getRecord<K extends StringKeyOf<P>>(type: K, id: string) {
    const records = this.initializedRecords.get(type);
    if (!records) {
      console.warn(`No records found for type ${type}`);
      return null;
    }
    const record = records.get(id);
    if (!record) {
      console.warn(`Record with id ${id} not found for type ${type}`);
      return null;
    }
    return record as TrackingInitialRecord<K>;
  }

  create<K extends StringKeyOf<P>>(type: K) {
    const id = this.generateId();
    const createdAt = Date.now();
    const record: TrackingInitialRecord<K> = { id, type, createdAt };
    this.ensureTypeRecords(type).set(id, record);
    this.options.onCreate?.(record);
    return record;
  }

  /**
   * Submits tracking data for a specific event type and processes associated records.
   *
   * @template K - The type parameter extending the string keys of the generic type P
   * @param type - The event type to submit data for
   * @param data - The data associated with the event type
   * @param idOrRecord - Optional identifier or tracking record
   *   - If a string is provided, it's treated as a record ID
   *   - If a TrackingInitialRecord object is provided, its ID is extracted
   *   - If omitted or no valid ID can be extracted, all records for the type will be processed
   *
   * @remarks
   * - When no ID is provided, all records of the given type are submitted and removed
   * - When an ID is provided but no matching record exists, a warning is logged
   * - After successful submission, the record is removed from storage
   */
  submit<K extends StringKeyOf<P>>(
    type: K,
    data: P[K],
    idOrRecord?: string | TrackingInitialRecord
  ) {
    const records = this.ensureTypeRecords(type);
    const submittedAt = Date.now();
    const id = typeof idOrRecord === "string" ? idOrRecord : idOrRecord?.id;
    if (!id) {
      records.forEach((record) => {
        this.triggerSubmit<K>({ record, submittedAt, data, type });
        records.delete(record.id);
      });
      return;
    }
    const record = records.get(id);
    if (!record) {
      console.warn(`Record with id ${id} not found for type ${type}`);
      return;
    }
    this.triggerSubmit<K>({ record, submittedAt, data, type });
    records.delete(id);
  }
}
