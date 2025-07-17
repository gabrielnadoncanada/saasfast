export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type FetchResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; data: null };

export type FormResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<keyof T, string[]>>;
    };
