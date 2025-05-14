import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './particular_search.css';

const CustomerSearch = () => {
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [locationHistory, setLocationHistory] = useState([]);
  const [riskFactors, setRiskFactors] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!customerId.trim()) {
      setError('Please enter a valid Customer ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // FastAPI routes for your second ADK agent
      // Change these URLs to match your actual deployment
      const BASE_URL = 'http://your-second-adk-agent-url';
      
      // In production, use actual API calls like these:
      /*
      // Get all customer data in parallel for efficiency
      const [
        customerProfileResponse,
        transactionsResponse,
        locationHistoryResponse,
        riskFactorsResponse
      ] = await Promise.all([
        fetch(`${BASE_URL}/api/customer/${customerId}/profile`),
        fetch(`${BASE_URL}/api/customer/${customerId}/transactions`),
        fetch(`${BASE_URL}/api/customer/${customerId}/locations`),
        fetch(`${BASE_URL}/api/customer/${customerId}/risk-factors`)
      ]);
      
      // Check if customer exists
      if (!customerProfileResponse.ok) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }
      
      // Parse the JSON responses
      const customerDetails = await customerProfileResponse.json();
      const transactions = await transactionsResponse.json();
      const locations = await locationHistoryResponse.json();
      const risks = await riskFactorsResponse.json();
      
      setCustomerData(customerDetails);
      setTransactionHistory(transactions);
      setLocationHistory(locations);
      setRiskFactors(risks);
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if customer exists (for demo purposes)
      if (customerId === 'C10048' || customerId === 'C10082' || customerId.toLowerCase() === 'c10045') {
        // Placeholder customer data based on screenshot
        const customerDetails = {
          customerId: customerId.toUpperCase(),
          customerName: customerId === 'C10048' ? 'Raju Sharma' : 
                        customerId === 'C10082' ? 'Hans Mueller' : 'Raju Sharma',
          email: customerId === 'C10048' ? 'raju.sharma@gmail.com' : 
                customerId === 'C10082' ? 'hans.mueller@gmail.com' : 'raju.sharma@gmail.com',
          riskScore: customerId === 'C10048' ? 95 : 
                    customerId === 'C10082' ? 81 : 95,
          accountCreationDate: '2022-01-15',
          lastActivity: '2023-05-27',
          totalTransactions: customerId === 'C10048' ? 47 : 
                            customerId === 'C10082' ? 32 : 24,
          averageTransactionAmount: customerId === 'C10048' ? 8500 : 
                                   customerId === 'C10082' ? 7200 : 6700
        };
        
        // Placeholder transaction history
        const transactions = [
          {
            transactionId: 'TX78901',
            date: '2023-05-27T09:15:00.000Z',
            amount: 17000,
            type: 'Outgoing',
            recipientId: 'C10090',
            recipientName: 'Michael Brown',
            location: 'New York'
          },
          {
            transactionId: 'TX78902',
            date: '2023-05-27T10:30:00.000Z',
            amount: 15000,
            type: 'Outgoing',
            recipientId: 'C10046',
            recipientName: 'Emma Wilson',
            location: 'Los Angeles'
          },
          {
            transactionId: 'TX78905',
            date: '2023-05-26T14:20:00.000Z',
            amount: 12500,
            type: 'Incoming',
            senderId: 'C10047',
            senderName: 'Mohammad Ali Patel',
            location: 'Chicago'
          },
          {
            transactionId: 'TX78910',
            date: '2023-05-25T16:45:00.000Z',
            amount: 9800,
            type: 'Outgoing',
            recipientId: 'C10043',
            recipientName: 'David Cooper',
            location: 'Miami'
          },
          {
            transactionId: 'TX78915',
            date: '2023-05-24T11:30:00.000Z',
            amount: 7500,
            type: 'Incoming',
            senderId: 'C10083',
            senderName: 'Sofia Lindberg',
            location: 'New York'
          }
        ];
        
        // Placeholder location history
        const locations = [
          {
            date: '2023-05-27T09:15:00.000Z',
            location: 'New York',
            activity: 'Transaction TX78901'
          },
          {
            date: '2023-05-27T10:30:00.000Z',
            location: 'Los Angeles',
            activity: 'Transaction TX78902'
          },
          {
            date: '2023-05-26T14:20:00.000Z',
            location: 'Chicago',
            activity: 'Transaction TX78905'
          },
          {
            date: '2023-05-25T16:45:00.000Z',
            location: 'Miami',
            activity: 'Transaction TX78910'
          },
          {
            date: '2023-05-24T11:30:00.000Z',
            location: 'New York',
            activity: 'Transaction TX78915'
          }
        ];
        
        // Placeholder risk factors
        const risks = [
          { 
            factor: 'Multiple large transactions in short time period', 
            severity: 'High',
            description: 'Customer conducted 3 transactions over $10,000 within 48 hours'
          },
          { 
            factor: 'Transactions from multiple geographic locations', 
            severity: 'High',
            description: 'Customer initiated transactions from 4 different cities in 5 days'
          },
          { 
            factor: 'Transaction pattern deviation', 
            severity: 'Medium',
            description: 'Recent transaction amounts significantly higher than historical average'
          },
          { 
            factor: 'Connections to high-risk entities', 
            severity: 'Medium',
            description: 'Transactions with 2 entities flagged in monitoring system'
          },
          { 
            factor: 'Unusual transaction timing', 
            severity: 'Low',
            description: 'Multiple transactions conducted outside normal business hours'
          }
        ];
        
        setCustomerData(customerDetails);
        setTransactionHistory(transactions);
        setLocationHistory(locations);
        setRiskFactors(risks);
      } else {
        setError(`No customer found with ID: ${customerId}`);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch customer data. Please try again.');
      setLoading(false);
      console.error('Error fetching customer data:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const getSeverityClass = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return '';
    }
  };

  return (
    <div className="customer-search-container">
      <div className="search-header">
        <h1>Customer Analysis</h1>
        <Link to="/" className="back-button">Back to Dashboard</Link>
      </div>

      <div className="search-form-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label htmlFor="customerId">Enter Customer ID:</label>
            <input
              type="text"
              id="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="e.g. C10048"
              required
            />
          </div>
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Analyze Customer'}
          </button>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>

      {customerData && (
        <div className="search-results">
          <div className="customer-profile section">
            <h2>Customer Profile</h2>
            <div className="profile-details">
              <div className="profile-item">
                <span className="label">Customer ID:</span>
                <span className="value">{customerData.customerId}</span>
              </div>
              <div className="profile-item">
                <span className="label">Name:</span>
                <span className="value">{customerData.customerName}</span>
              </div>
              <div className="profile-item">
                <span className="label">Email:</span>
                <span className="value">{customerData.email}</span>
              </div>
              <div className="profile-item">
                <span className="label">Risk Score:</span>
                <span className={`value risk-score ${customerData.riskScore > 90 ? 'high-risk' : 
                                customerData.riskScore > 80 ? 'medium-risk' : 'low-risk'}`}>
                  {customerData.riskScore}
                </span>
              </div>
              <div className="profile-item">
                <span className="label">Account Created:</span>
                <span className="value">{customerData.accountCreationDate}</span>
              </div>
              <div className="profile-item">
                <span className="label">Last Activity:</span>
                <span className="value">{customerData.lastActivity}</span>
              </div>
              <div className="profile-item">
                <span className="label">Total Transactions:</span>
                <span className="value">{customerData.totalTransactions}</span>
              </div>
              <div className="profile-item">
                <span className="label">Avg. Transaction Amount:</span>
                <span className="value">{formatCurrency(customerData.averageTransactionAmount)}</span>
              </div>
            </div>
          </div>

          <div className="risk-factors section">
            <h2>Risk Factors</h2>
            <div className="risk-factors-list">
              {riskFactors.map((risk, index) => (
                <div key={index} className={`risk-factor ${getSeverityClass(risk.severity)}`}>
                  <div className="risk-factor-header">
                    <h3>{risk.factor}</h3>
                    <span className="severity">{risk.severity}</span>
                  </div>
                  <p className="description">{risk.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="transaction-history section">
            <h2>Recent Transactions</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Date & Time</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>{transactionHistory[0]?.type === 'Outgoing' ? 'Recipient' : 'Sender'}</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((transaction) => (
                    <tr key={transaction.transactionId}>
                      <td>{transaction.transactionId}</td>
                      <td>{formatDate(transaction.date)}</td>
                      <td className={transaction.type === 'Outgoing' ? 'amount-out' : 'amount-in'}>
                        {transaction.type === 'Outgoing' ? '- ' : '+ '}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td>{transaction.type}</td>
                      <td>
                        {transaction.type === 'Outgoing' 
                          ? `${transaction.recipientName} (${transaction.recipientId})` 
                          : `${transaction.senderName} (${transaction.senderId})`}
                      </td>
                      <td>{transaction.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="location-history section">
            <h2>Location Activity</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Location</th>
                    <th>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {locationHistory.map((location, index) => (
                    <tr key={index}>
                      <td>{formatDate(location.date)}</td>
                      <td>{location.location}</td>
                      <td>{location.activity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;