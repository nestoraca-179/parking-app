import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAsync(asyncFunction, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const requestId = useRef(0);

  const run = useCallback(async () => {
    requestId.current += 1;
    const current = requestId.current;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const data = await asyncFunction();
      if (current === requestId.current) {
        setState({ data, loading: false, error: null });
      }
    } catch (error) {
      if (current === requestId.current) {
        setState({ data: null, loading: false, error });
      }
    }
  }, dependencies);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run };
}
