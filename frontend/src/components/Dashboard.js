import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [largeTransactions, setLargeTransactions] = useState([]);
  const [frequentTransactions, setFrequentTransactions] = useState([]);
  const [multipleLocations, setMultipleLocations] = useState([]);
  const [highRiskCustomers, setHighRiskCustomers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real implementation, these would be API calls to your ADK agent
    // For now, using placeholder data based on the screenshot
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // FastAPI routes for your first ADK agent
      // Change these URLs to match your actual deployment
      const BASE_URL = 'http://your-first-adk-agent-url';
      
      // In production, use actual API calls like these
      /*
      const [
        largeTransactionsResponse,
        multipleLocationsResponse,
        highRiskResponse,
        frequentTransactionsResponse
      ] = await Promise.all([
        fetch(`${BASE_URL}/api/large-transactions`),
        fetch(`${BASE_URL}/api/multiple-locations`),
        fetch(`${BASE_URL}/api/high-risk-customers`),
        fetch(`${BASE_URL}/api/frequent-transactions`)
      ]);
      
      const largeTxData = await largeTransactionsResponse.json();
      const multipleLocationsData = await multipleLocationsResponse.json();
      const highRiskData = await highRiskResponse.json();
      const frequentTxData = await frequentTransactionsResponse.json();
      */
      
      // Placeholder data for large transactions
      const largeTxData = [
        { customerId: "C10048", customerName: "Raju Sharma", email: "raju.sharma@gmail.com", largeTransactionCount: 7 },
        { customerId: "C10047", customerName: "Mohammad Ali Patel", email: "mohammad.ali@gmail.com", largeTransactionCount: 6 },
        { customerId: "C10043", customerName: "David Cooper", email: "david.cooper@hotmail.com", largeTransactionCount: 6 },
        { customerId: "C10083", customerName: "Sofia Lindberg", email: "sofia.lindberg@hotmail.com", largeTransactionCount: 6 },
        { customerId: "C10050", customerName: "Ahmad Khan", email: "ahmad.khan@gmail.com", largeTransactionCount: 5 },
        { customerId: "C10049", customerName: "Li Wei", email: "li.wei@hotmail.com", largeTransactionCount: 5 },
        { customerId: "C10090", customerName: "Michael Brown", email: "michael.brown@gmail.com", largeTransactionCount: 5 },
        { customerId: "C10091", customerName: "Jack Thompson", email: "jack.thompson@gmail.com", largeTransactionCount: 5 },
        { customerId: "C10046", customerName: "Emma Wilson", email: "emma.wilson@hotmail.com", largeTransactionCount: 4 },
        { customerId: "C10044", customerName: "Carlos Rodriguez", email: "carlos.rodriguez@gmail.com", largeTransactionCount: 4 }
      ];
      
      // Placeholder data for multiple location transactions
      const multipleLocationsData = [
        { customerId: "C10048", customerName: "Raju Sharma", email: "raju.sharma@gmail.com", startTime: "2023-05-27T09:00:00.000Z", endTime: "2023-05-27T10:30:00.000Z", locationCount: 3 },
        { customerId: "C10082", customerName: "Hans Mueller", email: "hans.mueller@gmail.com", startTime: "2023-05-29T15:45:00.000Z", endTime: "2023-05-29T17:15:00.000Z", locationCount: 2 },
        { customerId: "C10093", customerName: "Sophia Dubois", email: "sophia.dubois@hotmail.com", startTime: "2023-05-27T21:00:00.000Z", endTime: "2023-05-28T00:00:00.000Z", locationCount: 2 },
        { customerId: "C10054", customerName: "Carlos Rodriguez", email: "carlos.rodriguez@gmail.com", startTime: "2023-05-27T18:30:00.000Z", endTime: "2023-05-27T20:00:00.000Z", locationCount: 2 },
        { customerId: "C10055", customerName: "Ana Silva", email: "ana.silva@gmail.com", startTime: "2023-05-28T08:57:00.000Z", endTime: "2023-05-28T10:40:00.000Z", locationCount: 2 },
        { customerId: "C10077", customerName: "Mohammad Ali", email: "mohammad.ali@gmail.com", startTime: "2023-05-29T16:15:00.000Z", endTime: "2023-05-29T18:00:00.000Z", locationCount: 2 },
        { customerId: "C10084", customerName: "Olga Petrova", email: "olga.petrova@gmail.com", startTime: "2023-05-29T15:17:00.000Z", endTime: "2023-05-29T17:00:00.000Z", locationCount: 2 },
        { customerId: "C10088", customerName: "Jack Thompson", email: "jack.thompson@gmail.com", startTime: "2023-05-29T18:15:00.000Z", endTime: "2023-05-29T20:30:00.000Z", locationCount: 2 },
        { customerId: "C10092", customerName: "Marco Rossi", email: "marco.rossi@gmail.com", startTime: "2023-05-29T19:45:00.000Z", endTime: "2023-05-29T21:25:00.000Z", locationCount: 2 },
        { customerId: "C10093", customerName: "Sofia Lindberg", email: "sofia.lindberg@hotmail.com", startTime: "2023-05-31T20:00:00.000Z", endTime: "2023-05-31T21:30:00.000Z", locationCount: 2 }
      ];
      
      // Placeholder data for high risk customers
      const highRiskData = [
        { customerId: "C10048", customerName: "Raju Sharma", email: "raju.sharma@gmail.com", riskScore: 95 },
        { customerId: "C10047", customerName: "Mohammad Ali Patel", email: "mohammad.ali@gmail.com", riskScore: 92 },
        { customerId: "C10046", customerName: "Emma Wilson", email: "emma.wilson@hotmail.com", riskScore: 88 },
        { customerId: "C10043", customerName: "David Cooper", email: "david.cooper@hotmail.com", riskScore: 85 },
        { customerId: "C10091", customerName: "Jack Thompson", email: "jack.thompson@gmail.com", riskScore: 82 },
        { customerId: "C10082", customerName: "Hans Mueller", email: "hans.mueller@gmail.com", riskScore: 81 },
        { customerId: "C10090", customerName: "Michael Brown", email: "michael.brown@gmail.com", riskScore: 79 },
        { customerId: "C10049", customerName: "Li Wei", email: "li.wei@hotmail.com", riskScore: 77 },
        { customerId: "C10083", customerName: "Sofia Lindberg", email: "sofia.lindberg@hotmail.com", riskScore: 75 },
        { customerId: "C10093", customerName: "David Cooper", email: "david.cooper@hotmail.com", riskScore: 72 }
      ];
      
      // Placeholder data for frequent transactions
      const frequentTxData = [
        { customerId: "C10045", customerName: "Raju Sharma", email: "raju.sharma@gmail.com", sentTime: "2023-05-27T23:30:00.000Z", endTime: "2023-05-27T20:30:00.000Z", transactionCount: 5, totalAmount: 18000 }
        // Add more examples if needed
      ];

      setLargeTransactions(largeTxData);
      setMultipleLocations(multipleLocationsData);
      setHighRiskCustomers(highRiskData);
      setFrequentTransactions(frequentTxData);
      setLoading(false);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again later.");
      setLoading(false);
      console.error("Error fetching dashboard data:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Anti-Money Laundering Dashboard</h1>
      
      <div className="dashboard-section">
        <h2>Top 10 High Risk Customers</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {highRiskCustomers.map((customer) => (
                <tr key={customer.customerId}>
                  <td>{customer.customerId}</td>
                  <td>{customer.customerName}</td>
                  <td>{customer.email}</td>
                  <td>{customer.riskScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Customers with Multiple Location Transactions</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Location Count</th>
              </tr>
            </thead>
            <tbody>
              {multipleLocations.map((customer) => (
                <tr key={`${customer.customerId}-${customer.startTime}`}>
                  <td>{customer.customerId}</td>
                  <td>{customer.customerName}</td>
                  <td>{customer.email}</td>
                  <td>{formatDate(customer.startTime)}</td>
                  <td>{formatDate(customer.endTime)}</td>
                  <td>{customer.locationCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Customers with Large Transaction Counts</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Large Transaction Count</th>
              </tr>
            </thead>
            <tbody>
              {largeTransactions.map((customer) => (
                <tr key={customer.customerId}>
                  <td>{customer.customerId}</td>
                  <td>{customer.customerName}</td>
                  <td>{customer.email}</td>
                  <td>{customer.largeTransactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Small Frequent Transactions</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Sent Time</th>
                <th>End Time</th>
                <th>Transaction Count</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {frequentTransactions.map((transaction) => (
                <tr key={`${transaction.customerId}-${transaction.sentTime}`}>
                  <td>{transaction.customerId}</td>
                  <td>{transaction.customerName}</td>
                  <td>{transaction.email}</td>
                  <td>{formatDate(transaction.sentTime)}</td>
                  <td>{formatDate(transaction.endTime)}</td>
                  <td>{transaction.transactionCount}</td>
                  <td>${transaction.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section search-section">
        <h2>Analyze Individual Customer</h2>
        <p>Analyze transaction patterns for a specific customer</p>
        <Link to="/analyze-customer" className="analyze-button">
          Analyze Customer
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;