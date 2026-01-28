
//storage utils
export const saveToLocalStorage = <T>(key: string, value: T) => {
    try {
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
    }
    catch (error) {
        console.error("Error saving to localStorage", error);
    }
};

export const getFromLocalStorage = <T>(key: string): T | null => {
    try {
        const serializedValue = localStorage.getItem(key);
        if (serializedValue === null) {
            return null;
        }
        return JSON.parse(serializedValue) as T;
    }
    catch (error) {
        console.error("Error getting from localStorage", error);
        return null;
    }
};

export const removeFromLocalStorage = (key: string) => {
    try {
        localStorage.removeItem(key);
    }
    catch (error) {
        console.error("Error removing from localStorage", error);
    }
};

export const clearLocalStorage = () => {
    try {
        localStorage.clear();
    }
    catch (error) {
        console.error("Error clearing localStorage", error);
    }
};