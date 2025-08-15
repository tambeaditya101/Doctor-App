export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : '');
export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString() : '');
