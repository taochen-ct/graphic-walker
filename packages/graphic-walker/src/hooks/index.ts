import { useState, useEffect } from 'react';

export function useDebounceValue<T>(value: T, timeout = 200): T {
    const [innerValue, setInnerValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setInnerValue(value), timeout);
        return () => clearTimeout(handler);
    }, [value]);
    return innerValue;
}

export function useDebounceValueBind<T>(value: T, setter: (v: T) => void, timeout = 200): [T, (v: T) => void] {
    const [innerValue, setInnerValue] = useState(value);
    const valueToSet = useDebounceValue(innerValue, timeout);
    useEffect(() => setInnerValue(value), [value])
    useEffect(() => setter(valueToSet), [valueToSet]);
    return [innerValue, setInnerValue];
}