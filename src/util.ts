const parseDateToDashFormat = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const paddedMonth = month.toString().padStart(2, '0');
  const day = date.getUTCDate();
  const paddedDay = day.toString().padStart(2, '0');

  return `${year}-${paddedMonth}-${paddedDay}`;
};

export { parseDateToDashFormat };
