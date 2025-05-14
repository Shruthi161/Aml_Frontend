import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [largeTransactions, setLargeTransactions] = useState([]);
  const [frequentTransactions, setFrequentTransactions] = useState([]);
  const [multipleLocations, setMultipleLocations] = useState([]);
  const [highRiskCustomers, setHighRiskCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  // Properly use useCallback to prevent infinite loops
  const createSessionAndFetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Configuration for your deployed API
      const APP_NAME = "dashboard_agent"; // This matches your test script
      const USER_ID = "anyone"; // Update to match your test script
      const SESSION_ID = `session_${new Date().getTime()}`; // This is fine as is
      console.log("Creating session:", SESSION_ID);
      
      // Base URL for API requests
      const BASE_URL = ""; // The proxy in package.json will handle this
      
      // Create session with the API
      const sessionUrl = `${BASE_URL}/apps/${APP_NAME}/users/${USER_ID}/sessions/${SESSION_ID}`;
      
      console.log("Sending request to:", sessionUrl);
      const sessionResponse = await fetch(sessionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          state: {
            preferred_language: "English"
          }
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000) // Increase to 30 seconds or more
      });
      
      if (!sessionResponse.ok) {
        throw new Error(`Failed to create session: ${sessionResponse.status}`);
      }
      
      let sessionData;
      try {
        sessionData = await sessionResponse.json();
        console.log("Session created successfully:", sessionData);
        setSessionInfo(sessionData);
      } catch (jsonError) {
        throw new Error(`Failed to parse session response: ${jsonError.message}`);
      }
      
      // Now run agents to analyze data - using same approach as Flask backend
      console.log("Running analysis...");
      const runUrl = `${BASE_URL}/run_sse`;
      
      // Since the endpoint returns SSE (Server-Sent Events), we need to handle it differently
      try {
        const response = await fetch(runUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            app_name: APP_NAME,
            user_id: USER_ID,
            session_id: SESSION_ID,
            new_message: {
              role: "user",
              parts: [{
                text: "Analyze"
              }]
            },
            streaming: false
          }),
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(20000) // 20 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`Failed to analyze data: ${response.status}`);
        }
        
        // Read the response as text first
        const responseText = await response.text();
        console.log("Raw SSE response:", responseText);
        
        // Parse SSE format manually
        // SSE responses are typically formatted as "data: {...}\n\n"
        let analysisData = [];
        
        // Split by double newlines to get individual SSE messages
        responseText.split('\n\n').forEach(chunk => {
          if (chunk.trim()) {
            // Extract JSON data from each "data:" line
            const dataMatch = chunk.match(/^data: (.+)$/m);
            if (dataMatch && dataMatch[1]) {
              try {
                const eventData = JSON.parse(dataMatch[1]);
                if (eventData) {
                  analysisData.push(eventData);
                }
              } catch (e) {
                console.warn("Failed to parse SSE data chunk:", e);
              }
            }
          }
        });
        
        console.log("Parsed analysis data:", analysisData);
        processAgentResults(analysisData);
        
      } catch (err) {
        throw new Error(`Failed to process SSE data: ${err.message}`);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error connecting to API:", err);
      
      // Check if this is an AbortError (timeout)
      if (err.name === 'AbortError') {
        setError(`API request timed out. Please try again.`);
      } else {
        setError(`API connection error: ${err.message}`);
      }
      
      setLoading(false);
      
      // Fallback to sample data if API fails
      fetchSampleData();
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Use a separate effect for initial load to prevent potential issues with mounting/unmounting
  useEffect(() => {
    // When component mounts, fetch data
    const fetchInitialData = async () => {
      await createSessionAndFetchData();
    };
    
    fetchInitialData();
    
    // Clean up function to handle component unmounting
    return () => {
      // Any cleanup needed
      console.log("Dashboard component unmounting");
    };
  }, []); // Only run on initial mount

  const processAgentResults = (agentResponses) => {
    // Added additional safety checks
    if (!agentResponses) {
      console.error("No agent responses received");
      return;
    }
    
    if (!Array.isArray(agentResponses)) {
      console.error("Expected array for agentResponses but got:", typeof agentResponses);
      return;
    }
    
    // Extract data from agent responses
    let riskData = [];
    let multipleLocData = [];
    let largeTransactionData = [];
    let freqTransactionData = [];
    
    // Process each agent's response
    agentResponses.forEach(response => {
      // Add safety check for response content
      if (!response || typeof response !== 'object') return;
      
      const parts = response.content?.parts || [];
      
      parts.forEach(part => {
        // Check for function responses
        if (part?.functionResponse) {
          const name = part.functionResponse.name;
          const result = part.functionResponse.response?.result || [];
          
          // Map to appropriate data arrays
          if (name === 'get_top_risk_customers') {
            riskData = result.map(customer => ({
              customerId: customer.customer_id,
              customerName: customer.customer_name,
              email: customer.email,
              riskScore: customer.risk_score
            }));
          } 
          else if (name === 'detect_multiple_location_transactions') {
            multipleLocData = result.map(item => ({
              customerId: item.customer_id,
              customerName: item.customer_name,
              email: item.email,
              startTime: item.start_time,
              endTime: item.end_time,
              locationCount: item.location_count
            }));
          }
          else if (name === 'detect_large_amount_transactions') {
            largeTransactionData = result.map(item => ({
              customerId: item.customer_id,
              customerName: item.customer_name,
              email: item.email,
              largeTransactionCount: item.large_transaction_count
            }));
          }
          else if (name === 'detect_frequent_small_transactions') {
            freqTransactionData = result.map(item => ({
              customerId: item.customer_id,
              customerName: item.customer_name,
              email: item.email,
              sentTime: item.first_transaction_date,
              endTime: item.last_transaction_date,
              transactionCount: item.transaction_count,
              totalAmount: item.total_amount
            }));
          }
        }
      });
    });
    
    // Update state with real data
    setHighRiskCustomers(riskData);
    setMultipleLocations(multipleLocData);
    setLargeTransactions(largeTransactionData);
    setFrequentTransactions(freqTransactionData);
  };
  
  const fetchSampleData = () => {
    console.log("Falling back to sample data");
    
    // Placeholder data for large transactions (same as before)
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
    
    // Use equivalent placeholder data from your API output
    const multipleLocationsData = [
      { customerId: "C10045", customerName: "Rajiv Sharma", email: "rajiv.sharma@email.com", startTime: "2025-05-01T10:10:23+00:00", endTime: "2025-05-05T13:35:39+00:00", locationCount: 3 },
      { customerId: "C10052", customerName: "Hans Mueller", email: "hans.mueller@email.com", startTime: "2025-03-27T12:53:14+00:00", endTime: "2025-03-29T09:58:32+00:00", locationCount: 2 },
      { customerId: "C10053", customerName: "Sophie Dubois", email: "sophie.dubois@email.com", startTime: "2025-03-28T14:47:23+00:00", endTime: "2025-03-30T17:39:44+00:00", locationCount: 2 },
      { customerId: "C10054", customerName: "Carlos Rodriguez", email: "carlos.rodriguez@email.com", startTime: "2025-03-31T11:26:37+00:00", endTime: "2025-04-02T10:45:52+00:00", locationCount: 2 },
      { customerId: "C10055", customerName: "Ana Silva", email: "ana.silva@gmail.com", startTime: "2025-03-31T11:26:37+00:00", endTime: "2025-04-03T15:36:18+00:00", locationCount: 2 },
      { customerId: "C10057", customerName: "Mohammed Al-Farsi", email: "mohammed.alfarsi@email.com", startTime: "2025-04-04T12:27:39+00:00", endTime: "2025-04-07T10:21:03+00:00", locationCount: 2 },
      { customerId: "C10058", customerName: "Olga Petrova", email: "olga.petrova@email.com", startTime: "2025-04-08T15:32:17+00:00", endTime: "2025-04-10T14:54:38+00:00", locationCount: 2 },
      { customerId: "C10059", customerName: "Ahmad Tan", email: "ahmad.tan@email.com", startTime: "2025-04-09T11:43:26+00:00", endTime: "2025-04-11T09:05:47+00:00", locationCount: 2 },
      { customerId: "C10062", customerName: "Marco Rossi", email: "marco.rossi@email.com", startTime: "2025-04-15T15:40:29+00:00", endTime: "2025-04-17T14:02:45+00:00", locationCount: 2 },
      { customerId: "C10063", customerName: "Sofia Lindberg", email: "sofia.lindberg@email.com", startTime: "2025-04-16T11:51:36+00:00", endTime: "2025-04-19T16:25:08+00:00", locationCount: 2 }
    ];
    
    // Updated high risk customer data
    const highRiskData = [
      { customerId: "C10045", customerName: "Rajiv Sharma", email: "rajiv.sharma@email.com", riskScore: 31606 },
      { customerId: "C10046", customerName: "Emma Wilson", email: "emma.wilson@email.com", riskScore: 631 },
      { customerId: "C10048", customerName: "Sarah Johnson", email: "sarah.johnson@email.com", riskScore: 211 },
      { customerId: "C10061", customerName: "Javier Gonzalez", email: "javier.gonzalez@email.com", riskScore: 61 },
      { customerId: "C10050", customerName: "Michael Brown", email: "michael.brown@email.com", riskScore: 61 },
      { customerId: "C10052", customerName: "Hans Mueller", email: "hans.mueller@email.com", riskScore: 61 },
      { customerId: "C10056", customerName: "David Nkosi", email: "david.nkosi@email.com", riskScore: 46 },
      { customerId: "C10051", customerName: "Yuki Tanaka", email: "yuki.tanaka@email.com", riskScore: 1 },
      { customerId: "C10049", customerName: "Li Wei", email: "li.wei@email.com", riskScore: 1 },
      { customerId: "C10065", customerName: "David Cohen", email: "david.cohen@email.com", riskScore: 1 }
    ];
    
    // Updated frequent transaction data
    const frequentTxData = [
      { customerId: "C10045", customerName: "Rajiv Sharma", email: "rajiv.sharma@email.com", sentTime: "2025-05-01T10:10:23+00:00", endTime: "2025-05-01T11:05:39+00:00", transactionCount: 5, totalAmount: 17400 },
      { customerId: "C10045", customerName: "Rajiv Sharma", email: "rajiv.sharma@email.com", sentTime: "2025-05-02T14:12:33+00:00", endTime: "2025-05-02T15:10:39+00:00", transactionCount: 5, totalAmount: 19200 }
    ];

    setLargeTransactions(largeTxData);
    setMultipleLocations(multipleLocationsData);
    setHighRiskCustomers(highRiskData);
    setFrequentTransactions(frequentTxData);
    setLoading(false);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleString();
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Date error";
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button className="retry-button" onClick={createSessionAndFetchData}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Anti-Money Laundering Dashboard</h1>
        <div className="connection-status">
          {sessionInfo ? (
            <span className="connected">Connected to API: Session ID {sessionInfo.id}</span>
          ) : (
            <span className="disconnected">Using Fallback Data</span>
          )}
        </div>
      </div>
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>High Risk Customers</h3>
          <div className="summary-value">{highRiskCustomers.length}</div>
        </div>
        <div className="summary-card">
          <h3>Multiple Location Activity</h3>
          <div className="summary-value">{multipleLocations.length}</div>
        </div>
        <div className="summary-card">
          <h3>Large Transactions</h3>
          <div className="summary-value">{largeTransactions.length}</div>
        </div>
        <div className="summary-card">
          <h3>Frequent Small Transactions</h3>
          <div className="summary-value">{frequentTransactions.length}</div>
        </div>
      </div>
      
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
              {highRiskCustomers.map((customer, index) => (
                <tr key={`${customer.customerId}-${index}`}>
                  <td>{customer.customerId}</td>
                  <td>{customer.customerName}</td>
                  <td>{customer.email}</td>
                  <td className="risk-score">{customer.riskScore}</td>
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
              {multipleLocations.map((customer, index) => (
                <tr key={`${customer.customerId}-${index}`}>
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
              {largeTransactions.map((customer, index) => (
                <tr key={`${customer.customerId}-${index}`}>
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
                <th>Start Time</th>
                <th>End Time</th>
                <th>Transaction Count</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {frequentTransactions.map((transaction, index) => (
                <tr key={`${transaction.customerId}-${index}`}>
                  <td>{transaction.customerId}</td>
                  <td>{transaction.customerName}</td>
                  <td>{transaction.email}</td>
                  <td>{formatDate(transaction.sentTime)}</td>
                  <td>{formatDate(transaction.endTime)}</td>
                  <td>{transaction.transactionCount}</td>
                  <td>${transaction.totalAmount?.toLocaleString() || '0'}</td>
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
      
      <div className="dashboard-refresh">
        <button className="refresh-button" onClick={createSessionAndFetchData}>
          Refresh Dashboard Data
        </button>
      </div>
    </div>
  );
};

export default Dashboard;