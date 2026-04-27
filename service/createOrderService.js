const applyFabricToken = require("./applyFabricTokenService");
const tools = require("../utils/tools");
const axios = require("axios");
const config = require("../config/config");


exports.createOrder = async (req, res) => {
  try {
    let title = req.body.title;
    let amount = req.body.amount;

    if (!title || !amount) {
      return res.status(400).json({
        success: false,
        message: "title and amount are required"
      });
    }

    let applyFabricTokenResult = await applyFabricToken();
    let fabricToken = applyFabricTokenResult.token;

    let createOrderResult = await exports.requestCreateOrder(
      fabricToken,
      title,
      amount
    );

    if (createOrderResult.result === "SUCCESS") {
      let prepayId = createOrderResult.biz_content.prepay_id;

      let receiveCode =
        `TELEBIRR$BUYGOODS$${config.merchantCode}$${amount}$${prepayId}$120m`;

      return res.status(200).json({
        success: true,
        receiveCode,
        prepayId
      });
    }

    return res.status(400).json({
      success: false,
      message: createOrderResult.msg
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


exports.requestCreateOrder = async (fabricToken, title, amount) => {
  try {
    const reqObject = createRequestObject(title, amount);
    const response = await axios.post(
      `${config.baseUrl}/payment/v1/merchant/preOrder`,
      reqObject,
      {
        headers: {
          "Content-Type": "application/json",
          "X-APP-Key": config.fabricAppId,
          Authorization: fabricToken,
        },
      }
    );

    // ✅ IMPORTANT: Return only the data, not the whole 'response' object
    return response.data; 
  } catch (error) {
    console.error("Axios Error:", error.response ? error.response.data : error.message);
    throw error;
  }
};


function createRequestObject(title, amount) {
  let req = {
    timestamp: tools.createTimeStamp(),
    nonce_str: tools.createNonceStr(),
    method: "payment.preorder",
    version: "1.0",
  };

  let biz = {
    trade_type: "Checkout",
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    merch_order_id: createMerchantOrderId(),

    // 🔥 NOW DYNAMIC FROM MOBILE
    title: title,
    total_amount: amount,

    trans_currency: "ETB",
    timeout_express: "120m",
    payee_identifier: config.merchantCode,
    payee_identifier_type: "04",
    payee_type: "5000",
  };

  req.biz_content = biz;
  req.sign = tools.signRequestObject(req);
  req.sign_type = "SHA256WithRSA";

  return req;
}

function createMerchantOrderId() {
  return new Date().getTime() + "";
}

function createRawRequest(prepayId) {
  let map = {
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    nonce_str: tools.createNonceStr(),
    prepay_id: prepayId,
    timestamp: tools.createTimeStamp(),
  };
  let sign = tools.signRequestObject(map);
  // order by ascii in array
  let rawRequest = [
    "appid=" + map.appid,
    "merch_code=" + map.merch_code,
    "nonce_str=" + map.nonce_str,
    "prepay_id=" + map.prepay_id,
    "timestamp=" + map.timestamp,
    "sign=" + sign,
    "sign_type=SHA256WithRSA",
  ].join("&");
  console.log("rawRequest = ", rawRequest);
  return rawRequest;
}


// module.exports = createOrder;
