exports.processMobilePayment = async (method, amount, phoneNumber) => {
  return new Promise((resolve, reject) => {
    console.log(`Processing ${method} for PKR ${amount} from ${phoneNumber}...`);
    
    // Simulate API Latency
    setTimeout(() => {
      // 90% Success Rate Simulation
      const isSuccess = Math.random() < 0.9; 

      if (isSuccess) {
        resolve({
          success: true,
          transactionId: "TXN-" + Date.now() + Math.floor(Math.random() * 1000),
          message: "Transaction Successful"
        });
      } else {
        reject(new Error("Payment Failed or Insufficient Balance"));
      }
    }, 2000);
  });
};