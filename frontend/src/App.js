import './App.css';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

function App() {
  const [loading, setLoading] = useState(false);
  const [orderAmount, setOrderAmount] = useState(0);
  const [orders, setOrders] = useState([]);

  async function fetchOrders() {
    const { data } = await axios.get('/list-orders');
    setOrders(data);
  }
  useEffect(() => {
    fetchOrders();
  }, []);

  function loadRazorpay() {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'; //dynamic loading of sdk razorpay checkout
    script.onerror = () => {
      alert('Razorpay SDK failed to load. Are you online?');
    };
    script.onload = async () => {
      try {
        setLoading(true);
        const orderPaymentConfig = {
          headers:{
            "X-SESSION-ID": "dc958d3d2dd042028cfff4080969e96d"
          }
        };
        const result = await axios.get('http://api.dev.myhubble.money/v1/orders/01GDAWFH5GJSXGS6RQ4XN9QF4A', orderPaymentConfig);

        const { amount, providerOrderId, currency } = result.data;
        const paymentConfig = await axios.get('http://api.dev.myhubble.money/v1/payments/config/', orderPaymentConfig);
        console.log(result.data)
        console.log(paymentConfig)

        const options = {
          key: paymentConfig.data.razorpayConfig.clientKey,
          amount: amount.toString(),
          currency: currency,
          name: 'example name',
          description: 'example transaction',
          order_id: providerOrderId,
          handler: async function (response) {
            const result = await axios.post('http://api.dev.myhubble.money/v1/app-callbacks/razorpay/notify-order', {
              amount: amount,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }, 
            orderPaymentConfig);
            alert(result.data.msg);
            console.log(response)
            //fetchOrders();
          },
          prefill: {
            name: 'example name',
            email: 'email@example.com',
            contact: '11111199999',
          },
          notes: {
            address: 'example address',
          },
          theme: {
            color: '#80c0f0',
          },
        };

        setLoading(false);
        
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (err) {
        alert(err);
        setLoading(false);
      }
    };
    document.body.appendChild(script);
  }

  return (
    <div className="App">
      <h1> Razorpay Example: Node & React</h1>
      <hr />
      <div>
        <h2> Pay Order</h2>
        <label>
          Amount:{' '}
          <input
            placeholder="INR"
            type="number"
            value={orderAmount}
            onChange={(e) => setOrderAmount(e.target.value)}
          ></input>
        </label>

        <button disabled={loading} onClick={loadRazorpay}>
          Razorpay
        </button>
        {loading && <div>Loading...</div>}
      </div>
      <div className="list-orders">
        <h2>List Orders</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>AMOUNT</th>
              <th>ISPAID</th>
              <th>RAZORPAY</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((x) => (
              <tr key={x._id}>
                <td>{x._id}</td>
                <td>{x.amount / 100}</td>
                <td>{x.isPaid ? 'YES' : 'NO'}</td>
                <td>{x.razorpay.paymentId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
