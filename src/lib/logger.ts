// Structured Logger for Observability (Phase 5)

export const logger = {
  info: (message: string, meta: Record<string, any> = {}) => {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message, ...meta }));
  },
  warn: (message: string, meta: Record<string, any> = {}) => {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message, ...meta }));
  },
  error: (message: string, meta: Record<string, any> = {}) => {
    console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), message, ...meta }));
  }
};
