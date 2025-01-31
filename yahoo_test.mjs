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
  const query = 'LUCYW';
  const queryOptions = {
    period1: '2025-01-01',
    interval: '1d',
  };
  try {
    const result = await yahooFinance.chart(query, queryOptions);
    const quotes = result.quotes;
    console.log(quotes);
  } catch (error) {
    console.log('Error 발생');
    console.log(typeof error);
    console.log(error.type);
    console.log(error.message);
  }
};

fetchData();
