import { parse, dateFormat } from "./index";

describe("simple spendings", () => {
  test("120 usd cafe", () => {
    expect(parse("120 usd cafe")).toMatchObject({
      date: dateFormat(new Date()),
      description: "Cafe",
      postings: [
        {
          account: "Assets:Cash:Pavel:USD",
          amount: -120,
          currency: "USD",
          decimalPlaces: 2,
          decimalMantissa: -12000,
        },
        {
          account: "Expenses:Live:Restraunt:USD",
          amount: 120,
          currency: "USD",
          decimalPlaces: 2,
          decimalMantissa: 12000,
        },
      ].sort((a, b) => a.account.localeCompare(b.account)),
    });
  });
  test("120 try cafe", () => {
    expect(parse("120 try cafe")).toMatchObject({
      date: dateFormat(new Date()),
      description: "Cafe",
      postings: [
        {
          account: "Assets:Cash:Pavel:TRY",
          amount: -120,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: -12000,
        },
        {
          account: "Expenses:Live:Restraunt:TRY",
          amount: 120,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: 12000,
        },
      ].sort((a, b) => a.account.localeCompare(b.account)),
    });
  });
  test("pavel 120 try cafe", () => {
    expect(parse("pavel 120 try cafe")).toMatchObject({
      date: dateFormat(new Date()),
      description: "Cafe",
      postings: [
        {
          account: "Assets:Cash:Pavel:TRY",
          amount: -120,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: -12000,
        },
        {
          account: "Expenses:Live:Restraunt:TRY",
          amount: 120,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: 12000,
        },
      ].sort((a, b) => a.account.localeCompare(b.account)),
    });
  });
  test("alena 120 try cafe", () => {
    expect(parse("alena 120 try cafe")).toMatchObject({
      date: dateFormat(new Date()),
      description: "Cafe",
      postings: [
        {
          account: "Assets:Cash:Alena:TRY",
          amount: -120,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: -12000,
        },
        {
          account: "Expenses:Live:Restraunt:TRY",
          amount: 120,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: 12000,
        },
      ].sort((a, b) => a.account.localeCompare(b.account)),
    });
  });

  test("120 try cafe ; some comment", () => {
    expect(parse("120 try cafe ; some comment")).toMatchObject({
      date: dateFormat(new Date()),
      description: "Cafe",
      comment: "some comment",
      postings: [
        {
          account: "Assets:Cash:Pavel:TRY",
          amount: -120,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: -12000,
        },
        {
          account: "Expenses:Live:Restraunt:TRY",
          amount: 120,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: 12000,
        },
      ].sort((a, b) => a.account.localeCompare(b.account)),
    });
  });
  test("120 rub yandex plus ; some comment", () => {
    expect(parse("120 rub yandex plus ; some comment")).toMatchObject({
      date: dateFormat(new Date()),
      description: "Yandex plus",
      comment: "some comment",
      postings: [
        {
          account: "Assets:Cash:Pavel:RUB",
          amount: -120,
          currency: "RUB",
          decimalPlaces: 2,
          decimalMantissa: -12000,
        },
        {
          account: "Expenses:Subscriptions:Yandex:RUB",
          amount: 120,
          currency: "RUB",
          decimalPlaces: 2,
          decimalMantissa: 12000,
        },
      ].sort((a, b) => a.account.localeCompare(b.account)),
    });
  });
});

describe("simple transfers", () => {
  test("transfer 100 try pavel to 100 try alena", () => {
    expect(parse("transfer 100 try pavel to 100 try alena")).toMatchObject({
      date: dateFormat(new Date()),
      description: "Transfer",
      postings: [
        {
          account: "Assets:Cash:Pavel:TRY",
          amount: -100,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: -10000,
        },
        {
          account: "Assets:Cash:Alena:TRY",
          amount: 100,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: 10000,
        },
      ].sort((a, b) => a.account.localeCompare(b.account)),
    });
  });
  test("transfer 100 try pavel to 100 try alena", () => {
    expect(
      parse("transfer 100 try pavel to 100 try alena ; some comment")
    ).toMatchObject({
      date: dateFormat(new Date()),
      description: "Transfer",
      comment: "some comment",
      postings: [
        {
          account: "Assets:Cash:Pavel:TRY",
          amount: -100,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: -10000,
        },
        {
          account: "Assets:Cash:Alena:TRY",
          amount: 100,
          currency: "TRY",
          decimalPlaces: 2,
          decimalMantissa: 10000,
        },
      ].sort((a, b) => a.account.localeCompare(b.account)),
    });
  });
});

describe("conversion transfers", () => {
  test("transfer 100 busd crypto to 99 tether crypto", () => {
    expect(
      parse("transfer 100 busd crypto to 100 tether crypto")
    ).toMatchObject({
      date: dateFormat(new Date()),
      description: "Transfer",
      postings: [
        {
          account: "Assets:Crypto:BUSD",
          amount: -100,
          currency: "BUSD",
          decimalPlaces: 10,
          decimalMantissa: -1000000000000,
        },
        {
          account: "Equity:Conversion:BUSD",
          amount: 100,
          currency: "BUSD",
          decimalPlaces: 10,
          decimalMantissa: 1000000000000,
        },
        {
          account: "Equity:Conversion:TETHER",
          amount: -99,
          currency: "TETHER",
          decimalPlaces: 10,
          decimalMantissa: -990000000000,
        },
        {
          account: "Assets:Crypto:TETHER",
          amount: 99,
          currency: "TETHER",
          decimalPlaces: 10,
          decimalMantissa: 990000000000,
        },
      ].sort((a, b) => a.account.localeCompare(b.account)),
    });
  });
});
