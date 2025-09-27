import React, { useState, useEffect } from 'react';
import { configAPI } from '../api/apiService';

const APITest = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAPIs = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Testing API connections...');
      
      // Test countries API
      console.log('1. Testing Countries API...');
      const countriesData = await configAPI.getAllCountries();
      console.log('Countries response:', countriesData);
      setCountries(countriesData?.data || countriesData || []);
      
      // Test states API
      console.log('2. Testing States API...');
      const statesData = await configAPI.getAllStates();
      console.log('States response:', statesData);
      setStates(statesData?.data || statesData || []);
      
      // Test districts API
      console.log('3. Testing Districts API...');
      const districtsData = await configAPI.getAllDistricts();
      console.log('Districts response:', districtsData);
      setDistricts(districtsData?.data || districtsData || []);
      
      // Test test endpoint
      console.log('4. Testing Test Countries Endpoint...');
      const testData = await configAPI.testCountries();
      console.log('Test endpoint response:', testData);
      
      console.log('All API tests completed successfully!');
      
    } catch (error) {
      console.error('API Test Error:', error);
      setError(`API Test Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPIs();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🌐 API Connection Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testAPIs} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test APIs'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Countries ({countries.length})</h3>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            padding: '10px',
            backgroundColor: '#f9f9f9'
          }}>
            {countries.length > 0 ? (
              countries.slice(0, 10).map((country, index) => (
                <div key={index} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                  <strong>{country.name}</strong> ({country.code})
                </div>
              ))
            ) : (
              <div>No countries loaded</div>
            )}
            {countries.length > 10 && (
              <div style={{ padding: '5px 0', fontStyle: 'italic', color: '#666' }}>
                ... and {countries.length - 10} more
              </div>
            )}
          </div>
        </div>

        <div>
          <h3>States ({states.length})</h3>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            padding: '10px',
            backgroundColor: '#f9f9f9'
          }}>
            {states.length > 0 ? (
              states.slice(0, 10).map((state, index) => (
                <div key={index} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                  <strong>{state.name}</strong> ({state.code})
                </div>
              ))
            ) : (
              <div>No states loaded</div>
            )}
            {states.length > 10 && (
              <div style={{ padding: '5px 0', fontStyle: 'italic', color: '#666' }}>
                ... and {states.length - 10} more
              </div>
            )}
          </div>
        </div>

        <div>
          <h3>Districts ({districts.length})</h3>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            padding: '10px',
            backgroundColor: '#f9f9f9'
          }}>
            {districts.length > 0 ? (
              districts.slice(0, 10).map((district, index) => (
                <div key={index} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                  <strong>{district.name}</strong> ({district.code})
                </div>
              ))
            ) : (
              <div>No districts loaded</div>
            )}
            {districts.length > 10 && (
              <div style={{ padding: '5px 0', fontStyle: 'italic', color: '#666' }}>
                ... and {districts.length - 10} more
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', border: '1px solid #b3d9ff', borderRadius: '5px' }}>
        <h4>📋 Test Instructions:</h4>
        <ol>
          <li>Make sure the backend is running on <code>http://localhost:8080</code></li>
          <li>Click "Test APIs" to verify all endpoints are working</li>
          <li>Check the browser console for detailed logs</li>
          <li>Verify that countries, states, and districts are loaded</li>
          <li>If successful, the Country Settings page should work properly</li>
        </ol>
      </div>
    </div>
  );
};

export default APITest;
