import { type } from "os";

export default { parse };
export { parse, dateFormat };

export interface ITransaction {
  /// yyyy-mm-dd
  date: string;
  description: string;
  postings: IPosting[];

  comment: string | null | undefined;
}

export interface IPosting {
  account: string;
  amount: number;
  currency: "TRY" | "USD" | "EUR" | "RUB" | "TETHER" | "BTC" | "BUSD";

  decimalPlaces: number;
  decimalMantissa: number;
}

function dateFormat(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parse(input: string): ITransaction {
  const lowerCaseInput = input.toLowerCase().trimStart().trimEnd();
  if (lowerCaseInput.startsWith("transfer"))
    return parseTransfer(lowerCaseInput);
  return parseSpending(lowerCaseInput);
}

function parseSpending(input: string): ITransaction {
  let match = input.match(
    /(?<from_account>[a-zA-Z\s]*\s)?(?<amount>\d{1,}\.{0,1}\d{1,})\s?(?<currency>try|usd|eur|rub)\s(?<to_account>[A-Za-z\s]+)\;?(?<comment>.*){0,1}/i
  );

  if (!match || !match.groups) throw Error(`parse error: ${input}`);

  const trnNl = match.groups;

  if (!trnNl.amount || !trnNl.currency || !trnNl.to_account)
    throw Error(`parse error: ${input}`);

  let fromPosting: IPosting = {
    account: getAssetAccount(trnNl.from_account || "", trnNl.currency),
    amount: -1 * +trnNl.amount,
    currency: getCurrency(trnNl.currency),
    decimalPlaces: getDecimalPlaces(trnNl.currency),
    decimalMantissa: getDecimalMantissa(
      -1 * +trnNl.amount,
      getDecimalPlaces(trnNl.currency)
    ),
  };

  if (fromPosting.amount > 0)
    throw Error(`parse error: from amount is negative: ${input}`);

  let toPosting: IPosting = {
    account: getExpenseAccount(trnNl.to_account || "", trnNl.currency),
    amount: +trnNl.amount,
    currency: getCurrency(trnNl.currency),
    decimalPlaces: getDecimalPlaces(trnNl.currency),
    decimalMantissa: getDecimalMantissa(
      +trnNl.amount,
      getDecimalPlaces(trnNl.currency)
    ),
  };

  return {
    date: dateFormat(new Date()),
    description: trim(capitalize(match.groups.to_account)),
    comment: match.groups.comment ? trim(match.groups.comment) : undefined,
    postings: [toPosting, fromPosting].sort((a, b) =>
      a.account.localeCompare(b.account)
    ),
  };
}

function getAssetAccount(account: string, currency: string): string {
  let baseToken = "Assets";
  let accountCategoryToken = getAssetCategoryToken(account);
  let accountPersonToken = getAssetPersonToken(account);
  let accountCurrency = currency.toUpperCase();

  if (isPersonRequired(accountCategoryToken) && accountPersonToken === "")
    accountPersonToken = "Pavel";

  return [baseToken, accountCategoryToken, accountPersonToken, accountCurrency]
    .filter((t) => t)
    .join(":");

  function isPersonRequired(accountCategoryToken: AssetCategoryTokenType) {
    return accountCategoryToken === "Cash" && currency.toUpperCase() === "TRY";
  }
}

function getAssetPersonToken(account: string): AssetPersonTokenType {
  if (account.indexOf("alena") > -1) return "Alena";
  if (account.indexOf("pavel") > -1) return "Pavel";
  return "";
}

type AssetPersonTokenType = "Alena" | "Pavel" | "";

function getAssetCategoryToken(account: string): AssetCategoryTokenType {
  if (account.indexOf("crypto") > -1) return "Crypto";
  if (account.indexOf("cash") > -1) return "Cash";
  if (account.indexOf("deniz") > -1) return "Deniz";
  if (account.indexOf("papara") > -1) return "Papara";
  return "Cash";
}
type AssetCategoryTokenType = "Cash" | "Deniz" | "Papara" | "Crypto";

function capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1);
}

function getDecimalPlaces(currency: string) {
  switch (currency.toUpperCase()) {
    case "TETHER":
      return 10;
    case "BTC":
      return 10;
    case "BUSD":
      return 10;
  }
  return 2;
}

function getDecimalMantissa(amount: number, decimalPlaces: number) {
  return +(amount * Math.pow(10, decimalPlaces)).toFixed(0);
}

function getCurrency(currencyToken: string) {
  switch (currencyToken) {
    case "try":
      return "TRY";
    case "usd":
      return "USD";
    case "eur":
      return "EUR";
    case "rub":
      return "RUB";
    case "tether":
      return "TETHER";
    case "btc":
      return "BTC";
    case "busd":
      return "BUSD";
    default:
      throw Error(`unknown currency: ${currencyToken}`);
  }
}

function getExpenseAccount(account: string, currency: string): string {
  const commodity = currency.toUpperCase();
  switch (trim(account.toLowerCase())) {
    case "medical":
      return `Expenses:Occasional:Medical:${commodity}`;
    case "groceries":
      return `Expenses:Live:Groceries:${commodity}`;
    case "cafe":
      return `Expenses:Live:Restraunt:${commodity}`;
    case "bar":
      return `Expenses:Fun:Bar:${commodity}`;
    case "taxi":
    case "bus":
      return `Expenses:Live:Transportation:${commodity}`;
    case "hookah":
      return `Expenses:Fun:Hookah:${commodity}`;
    case "yandex plus":
      return `Expenses:Subscriptions:Yandex:${commodity}`;

    default:
      return `Expenses:Inbox:${commodity}`;
  }
}

function trim(input: string): string {
  return input.trimStart().trimEnd();
}

function parseTransfer(input: string): ITransaction {
  let match = input.match(
    /transfer\s(?<from_amount>\d{1,5}\.?\d{0,5})\s(?<from_currency>usd|try|tether|busd|rub|btc)\s(?<from_account>[A-Za-z\s]+)\sto\s(?<to_amount>\d{1,5}\.?\d{0,5})\s(?<to_currency>usd|try|tether|busd|rub|btc)\s?(?<to_account>[A-Za-z\s]+)\;?(?<comment>.*){0,1}/i
  );

  if (!match || !match.groups) throw Error(`parse error: ${input}`);

  const trnNl = match.groups;
  const isExchange =
    trnNl.to_currency &&
    trnNl.from_currency.toLowerCase() !== trnNl.to_currency.toLowerCase();

  let toExchangePosting: IPosting | null = null,
    fromExchangePosting: IPosting | null = null;

  if (!trnNl.from_account && !trnNl.to_account)
    throw Error("needs at least one person");

  var fromPosting: IPosting = {
    account: getAssetAccount(trnNl.from_account || "", trnNl.from_currency),
    amount: -1 * +trnNl.from_amount,
    currency: getCurrency(trnNl.from_currency),
    decimalPlaces: getDecimalPlaces(trnNl.from_currency),
    decimalMantissa: getDecimalMantissa(
      -1 * +trnNl.from_amount,
      getDecimalPlaces(trnNl.from_currency)
    ),
  };

  var toPosting: IPosting = {
    account: getAssetAccount(trnNl.to_account || "", trnNl.to_currency),
    amount: +trnNl.to_amount,
    currency: getCurrency(trnNl.to_currency),
    decimalPlaces: getDecimalPlaces(trnNl.to_currency),
    decimalMantissa: getDecimalMantissa(
      +trnNl.to_amount,
      getDecimalPlaces(trnNl.to_currency)
    ),
  };

  if (isExchange) {
    toExchangePosting = {
      account: getExchangeAccount(trnNl.from_currency),
      amount: +trnNl.from_amount,
      currency: getCurrency(trnNl.from_currency),
      decimalPlaces: getDecimalPlaces(trnNl.from_currency),
      decimalMantissa: getDecimalMantissa(
        +trnNl.from_amount,
        getDecimalPlaces(trnNl.from_currency)
      ),
    };
    fromExchangePosting = {
      account: getExchangeAccount(trnNl.to_currency),
      amount: -1 * +trnNl.to_amount,
      currency: getCurrency(trnNl.to_currency),
      decimalPlaces: getDecimalPlaces(trnNl.to_currency),
      decimalMantissa: getDecimalMantissa(
        -1 * +trnNl.to_amount,
        getDecimalPlaces(trnNl.to_currency)
      ),
    };
  }

  return {
    date: dateFormat(new Date()),
    description: "Transfer",
    comment: match.groups.comment ? trim(match.groups.comment) : undefined,
    postings: (
      [toPosting, fromPosting, toExchangePosting, fromExchangePosting].filter(
        (t) => t !== null
      ) as IPosting[]
    ).sort((a, b) => a.account.localeCompare(b.account)),
  };
}

function getExchangeAccount(currency: string) {
  return `Equity:Conversion:${currency.toUpperCase()}`;
}
