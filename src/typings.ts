export interface TrackingInitialRecord<T extends string = string> {
  id: string;
  type: T;
  createdAt: number;
}

export type StringKeyOf<T extends Record<string, any>> = keyof T & string;

export type TrackingSubmitRecord<D extends Record<string, any>> = {
  [K in keyof D & string]: TrackingInitialRecord<K> & {
    submittedAt: number;
    data: D[K];
  };
}[keyof D & string];

export type TrackingSubmissionHandlers<D extends Record<string, any>> =
  Partial<{
    [K in keyof D & string]: (
      record: TrackingInitialRecord<K> & {
        submittedAt: number;
        data: D[K];
      }
    ) => void;
  }>;
