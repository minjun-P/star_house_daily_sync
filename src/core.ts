export type NationCode = "KR"|"US";
const interestingExchanges = ['NASDAQ', 'NYSE', 'AMEX', 'KSC', 'KOE'] as const;
export type InterestingExchange = typeof interestingExchanges[number];
export const EXCHANGE_NATION_MAP : {
  [key in NationCode]: InterestingExchange[];
} =  {
  "KR": ['KSC', 'KOE'],
  "US": ['NASDAQ', 'NYSE', 'AMEX'],
};

