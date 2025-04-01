declare module "~/hooks/use-debounce" {
  export function useDebounce<T>(value: T, delay: number): T;
}

declare module "~/hooks/use-local-storage" {
  export function useLocalStorage<T>(
    key: string,
    initialValue: T,
  ): [T, (value: T | ((prevValue: T) => T)) => void];
}
