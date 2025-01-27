import yahooFinance from 'yahoo-finance2';

const fetchData = async () => {
  const query = '001460.KS';
  const queryOptions = { period1: '2000-01-01', interval: '1d' };
  const result = await yahooFinance.historical(query, queryOptions);
  console.log(result[0]);
};

fetchData();
