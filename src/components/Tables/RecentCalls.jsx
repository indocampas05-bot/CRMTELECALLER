import React, { useState } from 'react';
import './RecentCalls.css';
import { PhoneCall, Eye, Pencil } from "lucide-react";

const calls = [
  { name: 'Ramesh Kumar', mobile: '+91 98765 43210', status: 'Interested', duration: '05:24',  time: '10:30 AM' },
  { name: 'Sangeetha R', mobile: '+91 91234 56789', status: 'Not Interested', duration: '02:15',  time: '10:25 AM' },
  { name: 'Vikram Singh', mobile: '+91 99887 66554', status: 'Callback', duration: '00:45',  time: '10:20 AM' },
  { name: 'Karthik B', mobile: '+91 90000 11111', status: 'No Answer', duration: '00:00', time: '10:15 AM' },
  { name: 'Lakshmi Narayanan', mobile: '+91 93456 78901', status: 'Interested', duration: '06:30',  time: '10:10 AM' },
];

const statusClass = {
  'Interested': 'badge-interested',
  'Not Interested': 'badge-not-interested',
  'Callback': 'badge-callback',
  'No Answer': 'badge-no-answer',
};

const RecentCalls = () => {
  const [callData, setCallData] = useState(calls);

  // Handle Call button click
  const handleCall = (call) => {
    // Check if mobile number exists
    if (call.mobile) {
      // For web, you can use window.location.href for tel: protocol
      // Or you can implement a custom call dialog/modal
      const confirmCall = window.confirm(`Call ${call.name} at ${call.mobile}?`);
      if (confirmCall) {
        // For actual calling, use: window.location.href = `tel:${call.mobile}`;
        alert(`Initiating call to ${call.name} (${call.mobile})`);
        // You can also integrate with WebRTC or your call service API here
        console.log(`Calling ${call.name} at ${call.mobile}`);
      }
    } else {
      alert('No phone number available for this contact');
    }
  };

  // Handle View button click
  const handleView = (call) => {
    // Show detailed information in a modal or alert
    const details = `
      Name: ${call.name}
      Mobile: ${call.mobile}
      Status: ${call.status}
      Duration: ${call.duration}
      Time: ${call.time}
    `;
    alert(details);
    // You can replace this with a modal component
    console.log('Viewing details for:', call);
  };

  // Handle Edit button click
  const handleEdit = (call) => {
    // Open edit modal or prompt for changes
    const newName = prompt('Edit Name:', call.name);
    if (newName && newName !== call.name) {
      const newMobile = prompt('Edit Mobile:', call.mobile);
      if (newMobile && newMobile !== call.mobile) {
        const newStatus = prompt('Edit Status (Interested/Not Interested/Callback/No Answer):', call.status);
        if (newStatus && newStatus !== call.status) {
          // Update the call data
          const updatedCalls = callData.map(item => {
            if (item.name === call.name && item.mobile === call.mobile) {
              return {
                ...item,
                name: newName,
                mobile: newMobile,
                status: newStatus
              };
            }
            return item;
          });
          setCallData(updatedCalls);
          alert('Call details updated successfully!');
        }
      }
    }
  };

  // Handle View All button click
  const handleViewAll = () => {
    // Navigate to calls page or show all calls
    alert('Navigating to all calls page...');
    // You can use react-router-dom: navigate('/calls')
    console.log('View all calls clicked');
  };

  return (
    <div className="recent-calls">
      <table className="calls-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {callData.map((call, index) => (
            <tr key={index}>
              <td className="call-name">{call.name}</td>
              <td className="call-mobile">{call.mobile}</td>
              <td><span className={`status-badge ${statusClass[call.status] || ''}`}>{call.status}</span></td>
              <td>{call.duration}</td>
              <td>{call.time}</td>
              <td>
                
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="view-all">
        <button className="view-all-btn" onClick={handleViewAll}>
          View All
        </button>
      </div>
    </div>
  );
};

export default RecentCalls;