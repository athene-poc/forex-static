let procGetData = false;
let procFetchRate = false;
let selectedView = "compare";
let lastUpdateTime;
let globalExchangeList;
let conversionMessage = "";
let selectedBaseFullName = "";
let selectedTargetFullName = "USD";
let exchangeRate = 0;
const STY = "style";
const D_NONE = "display:none";
const D_BLOCK = "display:block";

$(() => {
  getInitValues();
  getCurrencyName("USD");
});

async function getInitValues() {
  renderCompareDisplay();
}

$("#baseTextInput").on("keyup keypress blur change", function (e) {
  calculateExchangeRateTarget();
});

$("#targetTextInput").on("keyup keypress blur change", function (e) {
  calculateExchangeRateBase();
});

$("#targetSelect").change(() => {
  targetChange($("#targetSelect").val());
});

async function targetChange(currencyCode) {
  const ratePair = "USD" + currencyCode;
  $("#conversionMessageHeader").attr(STY, D_NONE);
  $("#fetchRateSpinner").attr(STY, D_BLOCK);
  $("#baseTextInput").attr("disabled", true);
  $("#targetTextInput").attr("disabled", true);
  let e = await getPairsValuesSingle(ratePair);
  if (e.code === 200 && e.rates) {
    exchangeRate = e.rates[ratePair]["rate"];
    const currencyName = getCurrencyName(currencyCode);
    $("#conversionMessageHeader").text(exchangeRate + " " + currencyName);
    $("#baseTextInput").val(1);
    calculateExchangeRateTarget();
    $("#lastUpdateDisplay").text(
      getCurrentTimeAndDate(e.rates[ratePair]["timestamp"])
    );
    $("#baseTextInput").attr("disabled", false);
    $("#targetTextInput").attr("disabled", false);
  } else {
    $("#conversionMessageHeader").text("Something went wrong.");
  }
  $("#conversionMessageHeader").attr(STY, D_BLOCK);
  $("#fetchRateSpinner").attr(STY, D_NONE);
}

$("#viewSelect").change(function () {
  selectedView = $("#viewSelect").val();
  $("#compareDisplay").attr(STY, D_NONE);
  $("#gridDisplay").attr(STY, D_NONE);
  $("#tableDisplay").attr(STY, D_NONE);
  $("#gridLoop").empty();
  $("#tableDisplayBody").empty();
  switch (selectedView) {
    case "table":
      $("#tableDisplay").attr(STY, D_BLOCK);
      renderTableDisplay();
      break;
    case "grid":
      $("#gridDisplay").attr(STY, D_BLOCK);
      renderGridDisplay();
      break;
    case "compare":
      $("#compareDisplay").attr(STY, D_BLOCK);
      renderCompareDisplay();
      break;
    default:
      break;
  }
});

async function getMultipleValues() {
  let exchangeList = [];
  const pairsList = SUPPORTED_PAIRS;
  let pairVals = await getPairsValues(pairsList["supportedPairs"]);

  globalExchangeList = pairVals;
  console.log(pairVals);
  return new Promise((resolve) => {
    Object.entries(pairVals.rates).forEach((rate) => {
      const myObj = {
        name1: rate[0],
        name2: rate[0].substr(3, 3) + rate[0].substr(0, 3),
        rate1: rate[1]["rate"],
        rate2: 1 / rate[1]["rate"],
        timestamp: rate[1]["timestamp"],
        curr1: rate[0].substr(0, 3),
        curr2: rate[0].substr(3, 3),
      };
      exchangeList.push(myObj);
    });
    return resolve(exchangeList);
  });
}

/**
 * Renders the Compare display
 */
async function renderCompareDisplay() {
  let index = 0;
  SUPPORTED_PAIRS.supportedPairs.forEach((e) => {
    const sub = e.substr(3, 3);
    if (sub != "USD") {
      let targetSelectOption = $("#targetSelectValue").clone();
      const newId = "targetSelectValue" + index;
      targetSelectOption.attr("id", newId);
      targetSelectOption.appendTo("#targetSelect");
      targetSelectOption.attr("value", sub);
      targetSelectOption.text(sub);
    }
    index++;
  });
  $("#conversionMessageHeader").text("Select a currency on the left.");
}

/**
 * Renders the Grid display
 */
async function renderGridDisplay() {
  $("#fetchDataSpinner").attr(STY, D_BLOCK);
  const exchangeList = await getMultipleValues();
  for (let index = 0; index < exchangeList.length; index++) {
    let tableDataRow = $("#gridSingleData").clone();
    const newId = "gridSingleData" + index;
    tableDataRow.attr("id", newId);
    tableDataRow.appendTo("#gridLoop");
    const newElem = $(`#${newId}`);
    newElem.find(".pairsDisplayBase").text(exchangeList[index].curr1);
    newElem.find(".pairsDisplayTarget").text(exchangeList[index].curr2);
    newElem
      .find("#rate1Paragraph")
      .text(transformDecimal(exchangeList[index].rate1));
    newElem
      .find("#rate2Paragraph")
      .text(transformDecimal(exchangeList[index].rate2));
    newElem
      .find("#baseFlagImg")
      .attr("src", getFlagsUrl(exchangeList[index].curr1.substr(0, 2)));
    newElem
      .find("#targetFlagImg")
      .attr("src", getFlagsUrl(exchangeList[index].curr2.substr(0, 2)));
  }
  $("#fetchDataSpinner").attr(STY, D_NONE);
}

/**
 * Renders the table display.
 */
async function renderTableDisplay() {
  $("#fetchDataSpinner").attr(STY, D_BLOCK);
  const exchangeList = await getMultipleValues();

  for (let index = 0; index < exchangeList.length; index++) {
    let tableDataRow = $("#tableDataRow").clone();
    const newId = "tableDataRow" + index;
    tableDataRow.attr("id", newId);
    tableDataRow.appendTo("#tableDisplayBody");
    $(`#${newId} td:nth-child(1)`).text("-");
    $(`#${newId} td:nth-child(2)`).text(exchangeList[index]["curr1"]);
    $(`#${newId} td:nth-child(3)`).text(exchangeList[index]["curr2"]);
    $(`#${newId} td:nth-child(4)`).text(exchangeList[index]["timestamp"]);
    $(`#${newId} td:nth-child(5)`).text(exchangeList[index]["rate1"]);
  }
  $("#fetchDataSpinner").attr(STY, D_NONE);
}

function getCurrencyName(val) {
  const ret = ISO_4217.list.find((e) => e.AlphabeticCode === val);
  if (ret && ret.Currency) {
    return ret.Currency;
  } else {
    return val;
  }
}

function calculateExchangeRateBase() {
  $("#baseTextInput").val($("#targetTextInput").val() / exchangeRate);
}
/**
 * Calculates and changes the DOMs.
 */
function calculateExchangeRateTarget() {
  $("#targetTextInput").val($("#baseTextInput").val() * exchangeRate);
}

// FOREX SERVICE
const URL1 = "https://www.freeforexapi.com/api/live";
const URL2 = "https://www.freeforexapi.com/api/live?pairs=";

/**
 *
 * @param ratePair the pairs
 */
async function getPairsValuesSingle(ratePair) {
  return new Promise((resolve) => {
    $.ajax({
      type: "get",
      url: `${CORS_PROXY}${URL2}${ratePair}`,
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (response) {
        console.log(response);
        if (response.code === 200) {
        }
        return resolve(response);
      },
      error: function (request, error) {
        if (this.tryCount <= this.retryLimit) {
          this.tryCount++;
          $.ajax(this);
          return;
        }
        alert(
          "You are either offline or connection to API is limited. We will display the offline data instead."
        );
        return resolve(getOfflineSingle(ratePair));
      },
    });
  });
}
function getPairsValues(param) {
  return new Promise((resolve) => {
    const lastUpdateTimestamp = lastUpdateTime * 1000;
    if (
      !lastUpdateTime ||
      new Date().getTime() - lastUpdateTimestamp >= 60000
    ) {
      $.ajax({
        type: "get",
        url: `${CORS_PROXY}${URL2}${param}`,
        dataType: "json",
        tryCount: 0,
        retryLimit: 3,
        success: function (response) {
          console.log(response);
          if (response.code === 200) {
            lastUpdateTime = response["rates"][param[0]]["timestamp"];
            $("#lastUpdateDisplay").text(getCurrentTimeAndDate(lastUpdateTime));
          }
          return resolve(response);
        },
        error: function (request, error) {
          if (this.tryCount <= this.retryLimit) {
            this.tryCount++;
            $.ajax(this);
            return;
          }
          alert(
            "You are either offline or connection to API is limited. We will display the offline data instead."
          );
          return resolve(getOfflineMulti());
        },
      });
    } else {
      return resolve(globalExchangeList);
    }
  });
}

function getOfflineSingle(ratePair) {
  let toReturn = "";
  Object.entries(OFFLINE_RATES.rates).forEach((rate) => {
    if (rate[0] === ratePair) {
      toReturn = rate;
    }
  });
  toReturn = {
    rates: { [toReturn[0]]: toReturn[1] },
    code: 200,
  };
  return toReturn;
}

function getOfflineMulti() {
  return OFFLINE_RATES;
}
