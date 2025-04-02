// Using PayMongo to create a payment link
paymongo.auth('sk_test_pWhDTcTMXwmFWnRWzvv1db1w', 'sk_test_pWhDTcTMXwmFWnRWzvv1db1w');  // Authenticate with your PayMongo keys

paymongo.createALink({
  data: {
    attributes: {
      amount: 10000,  // Payment amount in cents (10000 cents = 100.00 PHP)
      description: 'Test Payment'  // Description of the payment
    }
  }
})
.then(({ data }) => {
  // This is the response data from PayMongo
  console.log(data);
  const paymentLink = data.attributes.url;
  document.getElementById('paymentLink').innerHTML = `
    <p>Click to make payment: <a href="${paymentLink}" target="_blank">${paymentLink}</a></p>
  `;
})
.catch(err => {
  console.error('Error creating payment link:', err);
});