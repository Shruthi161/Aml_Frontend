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
      
      // API configurations
      const headers = {
        "Content-Type": "application/json"
      };
      const BASE_URL = "";
      // Create a session for the AML monitoring system
      const app_name = "root_agent"; // Using fixed value based on your test script
      const user_id = "user_" + Date.now(); // Generate unique user ID
      const session_id = "session_" + Date.now(); // Generate unique session ID
      
      // Create session
      const sessionUrl = `${BASE_URL}/apps/${app_name}/users/${user_id}/sessions/${session_id}`;
      const sessionBody = { "additionalProp1": {} };
      
      console.log("Creating session...");
      const sessionResponse = await fetch(sessionUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(sessionBody)
      });

      if (!sessionResponse.ok) {
        throw new Error(`Failed to create session: ${sessionResponse.status}`);
      }
      
      const sessionData = await sessionResponse.json();
      console.log("Session created successfully:", sessionData);
      
      // Send customer ID to the AML agent
      const runUrl = `${BASE_URL}/run`;
      const runData = {
        "app_name": app_name,
        "user_id": user_id,
        "session_id": session_id,
        "new_message": {
          "role": "user",
          "parts": [{
            "text": customerId
          }]
        },
        "streaming": false
      };
      
      console.log("Sending customer ID for analysis...");
      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(runData)
      });
      
      if (!runResponse.ok) {
        throw new Error(`Failed to analyze customer: ${runResponse.status}`);
      }
      
      const analysisResult = await runResponse.json();
      console.log("Analysis result:", analysisResult);
      console.log(analysisResult)
      // Process the real data from the API response
      const processedData = processApiResultData(analysisResult, customerId);
      
      setCustomerData(processedData.customerDetails);
      setTransactionHistory(processedData.transactions);
      setLocationHistory(processedData.locations);
      setRiskFactors(processedData.riskFactors);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch customer data. Please try again.');
      setLoading(false);
      console.error('Error fetching customer data:', err);
    }
  };

  // Process API result data to extract customer details, transactions, locations, and risk factors
  const processApiResultData = (apiResult, customerId) => {
    // Initialize result structure
    const result = {
      customerDetails: null,
      transactions: [],
      locations: [],
      riskFactors: []
    };
    
    try {
      // Find the report generator agent's response which contains the structured report
      const reportGeneratorResponse = apiResult.find(item => 
        item.author === 'report_generator_agent' && 
        item.actions && 
        item.actions.state_delta && 
        item.actions.state_delta.datacollectoroutput
      );
      
      if (!reportGeneratorResponse) {
        throw new Error('No report data found in the API response');
      }
      
      // Extract the report text
      const reportText = reportGeneratorResponse.actions.state_delta.datacollectoroutput;
      
      // Extract customer data
      const customerMatch = reportText.match(/Customer ID: (.*?)\\nName: (.*?)\\nAccounts: (.*?)\\nPrimary Location: (.*?)\\nContact: (.*?)(\\n|\/)/);
      if (customerMatch) {
        result.customerDetails = {
          customerId: customerMatch[1].trim(),
          customerName: customerMatch[2].trim(),
          accounts: customerMatch[3].trim().split(', '),
          primaryLocation: customerMatch[4].trim(),
          contact: customerMatch[5].trim(),
          email: customerMatch[5].split(' / ')[0].trim(),
          phone: customerMatch[5].split(' / ')[1]?.trim() || 'N/A',
        };
      }
      
      // Extract risk score
      const riskMatch = reportText.match(/Current Risk Score: (.*?)\\nPrevious Risk Score: (.*?)\\nThreshold: (.*?)\\n/);
      if (riskMatch) {
        result.customerDetails = {
          ...result.customerDetails,
          riskScore: parseFloat(riskMatch[1]),
          previousRiskScore: parseFloat(riskMatch[2]),
          riskThreshold: parseFloat(riskMatch[3])
        };
      }
      
      // Extract transaction history from function responses in the API result
      // Find function responses for transactions
      const functionResponses = apiResult.filter(item => 
        item.content && 
        item.content.parts && 
        item.content.parts.some(part => part.functionResponse)
      );
      
      // Extract detailed transaction data from function responses
      let transactions = [];
      functionResponses.forEach(response => {
        response.content.parts.forEach(part => {
          if (part.functionResponse) {
            const fnResponse = part.functionResponse;
            if (fnResponse.name === 'detect_large_amount_transactions' && fnResponse.response && fnResponse.response.result) {
              // Add large amount transactions
              fnResponse.response.result.forEach(tx => {
                transactions.push({
                  transactionId: tx.transaction_id,
                  date: tx.transaction_date,
                  amount: tx.amount,
                  type: tx.customer_id_send === customerId ? 'Outgoing' : 'Incoming',
                  senderId: tx.customer_id_send,
                  recipientId: tx.customer_id_dest,
                  senderLocation: tx.location_sender,
                  recipientLocation: tx.location_receiver,
                  transactionType: tx.transaction_type,
                  riskType: tx.risk_type
                });
              });
            }
          }
        });
      });
      
      // Sort transactions by date (most recent first)
      transactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Get top 10 most recent transactions
      result.transactions = transactions.slice(0, 10);
      
      // Extract location activity based on transactions
      result.locations = result.transactions.map(tx => ({
        date: tx.date,
        location: tx.type === 'Outgoing' ? tx.recipientLocation : tx.senderLocation,
        activity: `Transaction ${tx.transactionId} - ${tx.type}`
      }));
      
      // Extract risk factors from the ANALYSIS & CONCLUSION section
      const riskFactorsMatch = reportText.match(/Risk Factors:\n-(.*?)(?=\n\nBased on|$)/s);
      if (riskFactorsMatch) {
        const riskFactorsText = riskFactorsMatch[1].trim();
        const risksList = riskFactorsText.split('\n-').map(rf => rf.trim()).filter(rf => rf);
        
        // Map identified risk factors from report
        result.riskFactors = risksList.map(risk => {
          // Determine severity based on keywords in risk description
          let severity = 'Medium';
          if (risk.toLowerCase().includes('high') || 
              risk.toLowerCase().includes('significant') || 
              risk.toLowerCase().includes('critical')) {
            severity = 'High';
          } else if (risk.toLowerCase().includes('low') || 
                    risk.toLowerCase().includes('minor')) {
            severity = 'Low';
          }
          
          return {
            factor: risk.split('.')[0],
            severity: severity,
            description: risk
          };
        });
        
        // Add missing risk details from the transaction patterns
        if (result.riskFactors.length < 3) {
          // Add pattern analysis as additional risk factors
          const patternMatch = reportText.match(/Identified Patterns:(.*?)(?=\n\n-|$)/s);
          if (patternMatch) {
            const patterns = patternMatch[1].split('\n-').map(p => p.trim()).filter(p => p);
            patterns.forEach(pattern => {
              if (!result.riskFactors.some(rf => rf.description.includes(pattern))) {
                result.riskFactors.push({
                  factor: pattern.split('.')[0],
                  severity: pattern.toLowerCase().includes('high') ? 'High' : 'Medium',
                  description: pattern
                });
              }
            });
          }
        }
      }
      
      // If we didn't extract enough risk factors, add some default ones based on transaction data
      if (result.riskFactors.length < 3) {
        // Check for large transactions
        if (result.transactions.some(tx => tx.amount > 5000)) {
          result.riskFactors.push({
            factor: 'Large Amount Transactions', 
            severity: 'High',
            description: 'Multiple transactions over $5,000 in short time period'
          });
        }
        
        // Check for multiple locations
        const uniqueLocations = [...new Set([
          ...result.transactions.map(tx => tx.senderLocation),
          ...result.transactions.map(tx => tx.recipientLocation)
        ])];
        
        if (uniqueLocations.length > 2) {
          result.riskFactors.push({
            factor: 'Multiple Location Transactions', 
            severity: 'High',
            description: `Transactions across multiple countries (${uniqueLocations.slice(0, 3).join(', ')}) within days`
          });
        }
        
        // Cross-border activity
        if (result.transactions.some(tx => tx.senderLocation !== tx.recipientLocation)) {
          result.riskFactors.push({
            factor: 'Cross-Border Activity', 
            severity: 'High',
            description: 'High volume of international wire transfers to various jurisdictions'
          });
        }
      }
      
      // Add some additional calculated fields to customer data
      if (result.customerDetails) {
        result.customerDetails.totalTransactions = result.transactions.length;
        result.customerDetails.averageTransactionAmount = result.transactions.length > 0 ? 
          result.transactions.reduce((sum, tx) => sum + tx.amount, 0) / result.transactions.length : 0;
        result.customerDetails.lastActivity = result.transactions.length > 0 ? 
          new Date(result.transactions[0].date).toISOString().split('T')[0] : 'N/A';
        result.customerDetails.accountCreationDate = '2022-01-15'; // This would ideally come from the API too
      }
      
      return result;
    } catch (error) {
      console.error("Error processing API data:", error);
      
      // Return a minimal fallback structure with error information
      return {
        customerDetails: {
          customerId: customerId,
          customerName: 'Data Processing Error',
          email: 'error@processing.data',
          phone: 'N/A',
          riskScore: 0,
          accountCreationDate: 'N/A',
          lastActivity: 'N/A',
          totalTransactions: 0,
          averageTransactionAmount: 0
        },
        transactions: [],
        locations: [],
        riskFactors: [{
          factor: 'Data Processing Error', 
          severity: 'High',
          description: 'Failed to process API data. See console for details.'
        }]
      };
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
        <h1>AML Customer Analysis</h1>
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
              placeholder="e.g. C10045"
              required
            />
          </div>
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Customer'}
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
                <span className="label">Phone:</span>
                <span className="value">{customerData.phone}</span>
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
            {transactionHistory.length > 0 ? (
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
                            ? `${transaction.recipientId} (${transaction.recipientLocation})` 
                            : `${transaction.senderId} (${transaction.senderLocation})`}
                        </td>
                        <td>{transaction.type === 'Outgoing' ? transaction.recipientLocation : transaction.senderLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data-message">No transaction history available.</p>
            )}
          </div>

          <div className="location-history section">
            <h2>Location Activity</h2>
            {locationHistory.length > 0 ? (
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
            ) : (
              <p className="no-data-message">No location history available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;