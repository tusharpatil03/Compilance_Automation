import { useCallback, useState } from "react";

export function useForm<T>(initialValues: T) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const {name, value} = e.target;
            setValues((prev) => ({ ...prev, [name]: value }));
        },
        [setValues],
    );

    const resetForm = () => {
        setValues(initialValues);
        setErrors({});
    };

    const clearErrors = ()=> {
        setErrors({});
    }

    return {
        values,
        errors,
        handleChange,
        setErrors,
        resetForm,
        clearErrors
    }
}