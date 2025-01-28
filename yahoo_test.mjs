import yahooFinance from 'yahoo-finance2';

const parseDateToDashFormat = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
};

//183490.KQ
// TSLA
const fetchData = async () => {
  const query = 'IBHE';
  const queryOptions = {
    period1: '2025-01-20',
    interval: '1d',
  };
  const result = await yahooFinance.chart(query, queryOptions);
  const quotes = result.quotes;
  console.log(quotes);
};

fetchData();
