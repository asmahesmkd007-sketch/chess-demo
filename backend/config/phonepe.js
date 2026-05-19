const crypto = require('crypto');

// PhonePe Gateway Endpoints
const PHONEPE_HOSTS = {
  production: 'https://api.phonepe.com/apis/hermes',
  sandbox: 'https://api-preprod.phonepe.com/apis/pg-sandbox'
};

const getPhonePeConfig = () => {
  const env = process.env.PHONEPE_ENV === 'production' ? 'production' : 'sandbox';
  return {
    host: PHONEPE_HOSTS[env],
    merchantId: process.env.PHONEPE_MERCHANT_ID || 'PGOMT',
    saltKey: process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    env
  };
};

/**
 * Generate X-VERIFY signature header
 */
const calculateVerifyHeader = (payloadBase64, endpoint, saltKey, saltIndex) => {
  const data = payloadBase64 + endpoint + saltKey;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return `${hash}###${saltIndex}`;
};

/**
 * Initialize a PhonePe Standard Hosted Payment
 */
const initiatePhonePePayment = async ({ transactionId, userId, amount, redirectUrl, callbackUrl }) => {
  const config = getPhonePeConfig();
  
  const payload = {
    merchantId: config.merchantId,
    merchantTransactionId: transactionId,
    merchantUserId: `user_${userId}`,
    amount: Math.round(amount * 100), // Amount in paise
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl,
    paymentInstrument: {
      type: "PAY_PAGE"
    }
  };

  const payloadString = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadString).toString('base64');
  const verifyHeader = calculateVerifyHeader(payloadBase64, '/pg/v1/pay', config.saltKey, config.saltIndex);

  try {
    const response = await fetch(`${config.host}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': verifyHeader
      },
      body: JSON.stringify({ request: payloadBase64 })
    });

    const data = await response.json();
    if (!data.success) {
      console.error('PhonePe PG response failure:', data);
      throw new Error(data.message || 'Payment initiation failed.');
    }

    return {
      redirectUrl: data.data.instrumentResponse.redirectInfo.url,
      merchantTransactionId: transactionId
    };
  } catch (error) {
    console.error('PhonePe Payment Initiation Error:', error);
    throw error;
  }
};

/**
 * Check Transaction Status directly on PhonePe Hermex
 */
const checkPhonePeTransactionStatus = async (transactionId) => {
  const config = getPhonePeConfig();
  const endpoint = `/pg/v1/status/${config.merchantId}/${transactionId}`;
  
  // SHA256("/pg/v1/status/{merchantId}/{transactionId}" + saltKey) + "###" + saltIndex
  const dataToHash = endpoint + config.saltKey;
  const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
  const verifyHeader = `${hash}###${config.saltIndex}`;

  try {
    const response = await fetch(`${config.host}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': verifyHeader,
        'X-MERCHANT-ID': config.merchantId
      }
    });

    const data = await response.json();
    return {
      success: data.success && data.code === 'PAYMENT_SUCCESS',
      code: data.code,
      amount: data.data ? data.data.amount / 100 : 0,
      paymentId: data.data ? data.data.providerReferenceId : null,
      message: data.message
    };
  } catch (error) {
    console.error('PhonePe Status Check Error:', error);
    throw error;
  }
};

module.exports = { initiatePhonePePayment, checkPhonePeTransactionStatus };
