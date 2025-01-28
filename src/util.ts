const { CLOUD_RUN_TASK_INDEX, CLOUD_RUN_TASK_COUNT } = process.env;

const parseDateToDashFormat = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const paddedMonth = month.toString().padStart(2, '0');
  const day = date.getUTCDate();
  const paddedDay = day.toString().padStart(2, '0');

  return `${year}-${paddedMonth}-${paddedDay}`;
};

function debugLog(message: any, ...optionalParams: any[]) {
  const needsLog = process.env.NEEDS_LOG === 'true';
  if (needsLog) {
    console.log(`${consolePrefix()} ${message}`, ...optionalParams);
  }
}

function consolePrefix() {
  return `[${CLOUD_RUN_TASK_INDEX}/${CLOUD_RUN_TASK_COUNT}]`;
}

export { parseDateToDashFormat, debugLog };
