// import { useState } from "react";

// const createStateFromArray = <T extends readonly string[]>(
//     arr: T
// ): Record<T[number], string> => {
//     return Object.fromEntries(arr.map((key) => [key, ""])) as Record<
//         T[number],
//         string
//     >;
// };


// type FormState<T extends readonly string[]> = Record<T[number], string>;

// export function useForm(...args: string[]) {
//     const [formInput, setFormInput] = useState<FormState<typeof args>>(createStateFromArray(args));

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = e.target;
//         setFormInput((prev) => ({ ...prev, [name]: value }));
//     };

//     return {
//         formInput,
//         handleChange,
//         setFormInput
//     }
// }