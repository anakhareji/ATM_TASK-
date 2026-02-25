export const getErrorMessage = (err, fallback = "Internal Protocol Error") => {
    if (typeof err === 'string') return err;

    const detail = err?.response?.data?.detail;

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail) && detail.length > 0) {
        // Handle Pydantic V2 validation errors
        const first = detail[0];
        if (typeof first === 'object' && first.msg) {
            return `${first.msg}${first.loc ? ` (${first.loc.join('.')})` : ''}`;
        }
        return JSON.stringify(first);
    }

    if (typeof detail === 'object' && detail !== null) {
        return JSON.stringify(detail);
    }

    return err?.message || fallback;
};
